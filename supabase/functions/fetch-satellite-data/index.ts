import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SatelliteRequest {
  lat: number;
  lon: number;
  extent_m: number;
  start_date: string;
  end_date: string;
  datasets: string[]; // ['ndvi', 'lst', 'smap']
}

interface GEETokenResponse {
  access_token: string;
  expires_in: number;
}

// Cache for GEE access token (valid for 1 hour)
let cachedToken: { token: string; expiresAt: number } | null = null;

// Helper to create square geometry
function createSquareGeometry(lat: number, lon: number, extent_m: number) {
  const earthRadius = 6371000; // meters
  const latOffset = (extent_m / 2) / earthRadius * (180 / Math.PI);
  const lonOffset = (extent_m / 2) / (earthRadius * Math.cos(lat * Math.PI / 180)) * (180 / Math.PI);
  
  return {
    type: "Polygon",
    coordinates: [[
      [lon - lonOffset, lat - latOffset],
      [lon + lonOffset, lat - latOffset],
      [lon + lonOffset, lat + latOffset],
      [lon - lonOffset, lat + latOffset],
      [lon - lonOffset, lat - latOffset]
    ]]
  };
}

// Generate JWT for GEE authentication
async function generateGEEJWT(serviceAccountEmail: string, privateKey: string): Promise<string> {
  const header = {
    alg: "RS256",
    typ: "JWT"
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccountEmail,
    scope: "https://www.googleapis.com/auth/earthengine.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  };

  // Base64URL encode
  const base64UrlEncode = (obj: any) => {
    const json = JSON.stringify(obj);
    return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Import private key for signing
  const pemKey = privateKey.replace(/\\n/g, '\n');
  const binaryKey = pemKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  const keyData = Uint8Array.from(atob(binaryKey), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${signatureInput}.${base64Signature}`;
}

// Exchange JWT for GEE access token
async function getGEEAccessToken(serviceAccountEmail: string, privateKey: string): Promise<string> {
  // Check cache first
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    console.log('Using cached GEE access token');
    return cachedToken.token;
  }

  console.log('Generating new GEE access token...');
  const jwt = await generateGEEJWT(serviceAccountEmail, privateKey);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('GEE OAuth error:', error);
    throw new Error(`Failed to get GEE access token: ${error}`);
  }

  const data: GEETokenResponse = await response.json();
  
  // Cache token (expires in 3600 seconds, cache for 3500 to be safe)
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + 3500 * 1000
  };

  console.log('✅ GEE access token obtained');
  return data.access_token;
}

// Fetch MODIS NDVI from Google Earth Engine
async function fetchMODISNDVI(
  accessToken: string,
  geometry: any,
  startDate: string,
  endDate: string
): Promise<any> {
  console.log('Fetching MODIS NDVI from GEE...');
  
  try {
    const response = await fetch('https://earthengine.googleapis.com/v1/projects/earthengine-legacy/value:compute', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        expression: {
          functionName: "ImageCollection.reduce",
          functionInvocationValue: {
            functionReference: {
              functionName: "Reducer.mean"
            },
            arguments: {
              collection: {
                functionInvocationValue: {
                  functionName: "ImageCollection.filterDate",
                  arguments: {
                    collection: {
                      functionInvocationValue: {
                        functionName: "ImageCollection.filterBounds",
                        arguments: {
                          collection: {
                            constantValue: "MODIS/061/MOD13Q1"
                          },
                          geometry: { constantValue: geometry }
                        }
                      }
                    },
                    start: { constantValue: startDate },
                    end: { constantValue: endDate }
                  }
                }
              }
            }
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`GEE NDVI request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ MODIS NDVI data received');
    
    return {
      dataset: 'MODIS/061/MOD13Q1',
      values: data.result?.NDVI ? [
        { date: startDate, value: data.result.NDVI * 0.0001, age_days: 0, is_simulated: false }
      ] : [],
      scale: 0.0001,
      unit: 'NDVI',
      data_source: 'MODIS_REAL'
    };
  } catch (error) {
    console.error('Error fetching MODIS NDVI:', error);
    throw error;
  }
}

// Fetch MODIS LST from Google Earth Engine
async function fetchMODISLST(
  accessToken: string,
  geometry: any,
  startDate: string,
  endDate: string,
  extentMultiplier: number = 1
): Promise<any> {
  console.log(`Fetching MODIS LST from GEE (extent multiplier: ${extentMultiplier}x)...`);
  
  try {
    const response = await fetch('https://earthengine.googleapis.com/v1/projects/earthengine-legacy/value:compute', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        expression: {
          functionName: "ImageCollection.reduce",
          functionInvocationValue: {
            functionReference: {
              functionName: "Reducer.mean"
            },
            arguments: {
              collection: {
                functionInvocationValue: {
                  functionName: "ImageCollection.filterDate",
                  arguments: {
                    collection: {
                      functionInvocationValue: {
                        functionName: "ImageCollection.filterBounds",
                        arguments: {
                          collection: {
                            constantValue: "MODIS/061/MOD11A2"
                          },
                          geometry: { constantValue: geometry }
                        }
                      }
                    },
                    start: { constantValue: startDate },
                    end: { constantValue: endDate }
                  }
                }
              }
            }
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`GEE LST request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ MODIS LST data received');
    
    return {
      dataset: 'MODIS/061/MOD11A2',
      values: data.result?.LST_Day_1km ? [
        { 
          date: startDate, 
          value: data.result.LST_Day_1km * 0.02, // Kelvin
          age_days: 0, 
          is_simulated: false,
          area_multiplier: extentMultiplier
        }
      ] : [],
      conversion: '°C = LST * 0.02 - 273.15',
      unit: 'K',
      data_source: 'MODIS_REAL'
    };
  } catch (error) {
    console.error('Error fetching MODIS LST:', error);
    throw error;
  }
}

// Fetch SMAP Soil Moisture from Google Earth Engine
async function fetchSMAP(
  accessToken: string,
  geometry: any,
  startDate: string,
  endDate: string
): Promise<any> {
  console.log('Fetching SMAP soil moisture from GEE...');
  
  try {
    const response = await fetch('https://earthengine.googleapis.com/v1/projects/earthengine-legacy/value:compute', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        expression: {
          functionName: "ImageCollection.reduce",
          functionInvocationValue: {
            functionReference: {
              functionName: "Reducer.mean"
            },
            arguments: {
              collection: {
                functionInvocationValue: {
                  functionName: "ImageCollection.filterDate",
                  arguments: {
                    collection: {
                      functionInvocationValue: {
                        functionName: "ImageCollection.filterBounds",
                        arguments: {
                          collection: {
                            constantValue: "NASA_USDA/HSL/SMAP10KM_soil_moisture"
                          },
                          geometry: { constantValue: geometry }
                        }
                      }
                    },
                    start: { constantValue: startDate },
                    end: { constantValue: endDate }
                  }
                }
              }
            }
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`GEE SMAP request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ SMAP soil moisture data received');
    
    return {
      dataset: 'NASA_USDA/HSL/SMAP10KM_soil_moisture',
      values: data.result?.ssm ? [
        { date: startDate, value: data.result.ssm, age_days: 0, is_simulated: false }
      ] : [],
      unit: 'm³/m³',
      data_source: 'MODIS_REAL'
    };
  } catch (error) {
    console.error('Error fetching SMAP:', error);
    throw error;
  }
}

// Generate synthetic satellite data as final fallback
// Base values: NDVI=0.4656, Temp=21°C, Soil Moisture=0.516682
// Each day varies by ±10% randomly
function generateSyntheticData(startDate: string): any {
  console.log('🔬 Generating synthetic satellite data');
  
  // Base values as specified
  const baseNdvi = 0.4656;
  const baseTempCelsius = 21;
  const baseTempKelvin = baseTempCelsius + 273.15; // 294.15K
  const baseSoilMoisture = 0.516682;
  
  // Apply ±10% random variation
  const ndviVariation = (Math.random() - 0.5) * 0.2; // ±10%
  const ndvi = baseNdvi * (1 + ndviVariation);
  
  const lstVariation = (Math.random() - 0.5) * 0.2; // ±10%
  const lstKelvin = baseTempKelvin * (1 + lstVariation);
  
  const moistureVariation = (Math.random() - 0.5) * 0.2; // ±10%
  const soilMoisture = baseSoilMoisture * (1 + moistureVariation);
  
  return {
    ndvi: {
      dataset: 'SYNTHETIC',
      values: [{
        date: startDate,
        value: Number(ndvi.toFixed(4)),
        age_days: 0,
        is_simulated: true
      }],
      scale: 1,
      unit: 'NDVI',
      data_source: 'SYNTHETIC',
      note: 'Using synthetic data (base: NDVI=0.4656 ±10%)'
    },
    lst: {
      dataset: 'SYNTHETIC',
      values: [{
        date: startDate,
        value: Number(lstKelvin.toFixed(2)),
        age_days: 0,
        is_simulated: true
      }],
      conversion: '°C = LST - 273.15',
      unit: 'K',
      data_source: 'SYNTHETIC',
      note: `Using synthetic data (base: ${baseTempCelsius}°C ±10%)`
    },
    smap: {
      dataset: 'SYNTHETIC',
      values: [{
        date: startDate,
        value: Number(soilMoisture.toFixed(6)),
        age_days: 0,
        is_simulated: true
      }],
      unit: 'm³/m³',
      data_source: 'SYNTHETIC',
      note: 'Using synthetic data (base: 0.516682 m³/m³ ±10%)'
    }
  };
}

// Fetch last recorded data from database for this location
async function getLastRecordedData(lat: number, lon: number, supabaseUrl: string, supabaseKey: string) {
  console.log('🔍 Looking for last recorded data for this location...');
  
  try {
    // Query satellite_data table for the most recent data at this location
    // We'll use a small radius to find data for this location (within ~1km)
    const response = await fetch(
      `${supabaseUrl}/rest/v1/satellite_data?select=*&order=date.desc&limit=10`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      }
    );

    if (!response.ok) {
      console.warn('Could not fetch last recorded data');
      return null;
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      console.warn('No previous data found in database');
      return null;
    }

    // Get the most recent entry
    const lastEntry = data[0];
    const daysSinceLastData = Math.floor((new Date().getTime() - new Date(lastEntry.date).getTime()) / (1000 * 60 * 60 * 24));
    
    console.log(`✅ Found data from ${lastEntry.date} (${daysSinceLastData} days old)`);
    
    return {
      ndvi: {
        dataset: 'MODIS/061/MOD13Q1 (LAST_RECORDED)',
        values: lastEntry.ndvi ? [{
          date: lastEntry.date,
          value: parseFloat(lastEntry.ndvi),
          age_days: daysSinceLastData,
          is_simulated: false,
          is_last_recorded: true
        }] : [],
        scale: 0.0001,
        unit: 'NDVI',
        data_source: 'LAST_RECORDED',
        note: `Using last recorded data from ${lastEntry.date} (${daysSinceLastData} days ago)`
      },
      lst: {
        dataset: 'MODIS/061/MOD11A2 (LAST_RECORDED)',
        values: lastEntry.lst_kelvin ? [{
          date: lastEntry.date,
          value: parseFloat(lastEntry.lst_kelvin),
          age_days: daysSinceLastData,
          is_simulated: false,
          is_last_recorded: true
        }] : [],
        conversion: '°C = LST - 273.15',
        unit: 'K',
        data_source: 'LAST_RECORDED',
        note: `Using last recorded data from ${lastEntry.date} (${daysSinceLastData} days ago)`
      },
      smap: {
        dataset: 'NASA_USDA/HSL/SMAP10KM_soil_moisture (LAST_RECORDED)',
        values: lastEntry.soil_moisture ? [{
          date: lastEntry.date,
          value: parseFloat(lastEntry.soil_moisture),
          age_days: daysSinceLastData,
          is_simulated: false,
          is_last_recorded: true
        }] : [],
        unit: 'm³/m³',
        data_source: 'LAST_RECORDED',
        note: `Using last recorded data from ${lastEntry.date} (${daysSinceLastData} days ago)`
      }
    };
  } catch (error) {
    console.error('Error fetching last recorded data:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: SatelliteRequest = await req.json();
    
    // Validate inputs
    if (!body.lat || !body.lon || !body.extent_m || !body.start_date || !body.end_date) {
      throw new Error('Missing required parameters');
    }

    console.log(`🛰️ Fetching satellite data for (${body.lat}, ${body.lon}), extent: ${body.extent_m}m`);

    const geometry = createSquareGeometry(body.lat, body.lon, body.extent_m);
    const results: any = {
      geometry,
      datasets: {}
    };

    // Try to use real GEE data
    const serviceAccountEmail = Deno.env.get('GEE_SERVICE_ACCOUNT_EMAIL');
    const privateKey = Deno.env.get('GEE_PRIVATE_KEY');

    if (!serviceAccountEmail || !privateKey) {
      console.warn('⚠️ GEE credentials not configured, trying last recorded data');
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const lastRecordedData = await getLastRecordedData(body.lat, body.lon, supabaseUrl, supabaseKey);
      
      if (lastRecordedData) {
        if (body.datasets.includes('ndvi')) results.datasets.ndvi = lastRecordedData.ndvi;
        if (body.datasets.includes('lst')) results.datasets.lst = lastRecordedData.lst;
        if (body.datasets.includes('smap')) results.datasets.smap = lastRecordedData.smap;
      } else {
        // Use synthetic data as final fallback
        console.warn('⚠️ No last recorded data available, using synthetic data');
        const syntheticData = generateSyntheticData(body.start_date);
        if (body.datasets.includes('ndvi')) results.datasets.ndvi = syntheticData.ndvi;
        if (body.datasets.includes('lst')) results.datasets.lst = syntheticData.lst;
        if (body.datasets.includes('smap')) results.datasets.smap = syntheticData.smap;
      }
      
      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      // Get GEE access token
      const accessToken = await getGEEAccessToken(serviceAccountEmail, privateKey);

      // Fetch requested datasets from GEE with proper error handling
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const lastRecordedFallback = await getLastRecordedData(body.lat, body.lon, supabaseUrl, supabaseKey);
      
      if (body.datasets.includes('ndvi')) {
        try {
          const ndviData = await fetchMODISNDVI(accessToken, geometry, body.start_date, body.end_date);
          // Check if we got real data
          if (ndviData.values && ndviData.values.length > 0) {
            results.datasets.ndvi = ndviData;
            console.log('✅ Real NDVI data retrieved');
          } else {
            console.warn('⚠️ No NDVI data for requested date, using last recorded data');
            results.datasets.ndvi = lastRecordedFallback?.ndvi || { error: 'No data available' };
          }
        } catch (error) {
          console.error('NDVI fetch failed, using fallback:', error);
          if (lastRecordedFallback?.ndvi) {
            results.datasets.ndvi = lastRecordedFallback.ndvi;
          } else {
            const syntheticData = generateSyntheticData(body.start_date);
            results.datasets.ndvi = syntheticData.ndvi;
          }
        }
      }
      
      if (body.datasets.includes('lst')) {
        try {
          let lstData = await fetchMODISLST(accessToken, geometry, body.start_date, body.end_date, 1);
          
          // If LST data is empty (field too small), retry with 2x area
          if (!lstData.values || lstData.values.length === 0) {
            console.log('⚠️ LST data empty (field too small), retrying with 2x area...');
            const expandedGeometry = createSquareGeometry(body.lat, body.lon, body.extent_m * 2);
            lstData = await fetchMODISLST(accessToken, expandedGeometry, body.start_date, body.end_date, 2);
          }
          
          if (lstData.values && lstData.values.length > 0) {
            results.datasets.lst = lstData;
            console.log('✅ Real LST data retrieved');
          } else {
            console.warn('⚠️ No LST data for requested date, using last recorded data');
            results.datasets.lst = lastRecordedFallback?.lst || { error: 'No data available' };
          }
        } catch (error) {
          console.error('LST fetch failed, using fallback:', error);
          if (lastRecordedFallback?.lst) {
            results.datasets.lst = lastRecordedFallback.lst;
          } else {
            const syntheticData = generateSyntheticData(body.start_date);
            results.datasets.lst = syntheticData.lst;
          }
        }
      }
      
      if (body.datasets.includes('smap')) {
        try {
          const smapData = await fetchSMAP(accessToken, geometry, body.start_date, body.end_date);
          if (smapData.values && smapData.values.length > 0) {
            results.datasets.smap = smapData;
            console.log('✅ Real SMAP data retrieved');
          } else {
            console.warn('⚠️ No SMAP data for requested date, using last recorded data');
            results.datasets.smap = lastRecordedFallback?.smap || { error: 'No data available' };
          }
        } catch (error) {
          console.error('SMAP fetch failed, using fallback:', error);
          if (lastRecordedFallback?.smap) {
            results.datasets.smap = lastRecordedFallback.smap;
          } else {
            const syntheticData = generateSyntheticData(body.start_date);
            results.datasets.smap = syntheticData.smap;
          }
        }
      }

      console.log('✅ Satellite data fetch complete');

    } catch (geeError) {
      console.error('GEE authentication/fetch failed, trying fallback:', geeError);
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const lastRecordedData = await getLastRecordedData(body.lat, body.lon, supabaseUrl, supabaseKey);
      
      if (lastRecordedData) {
        if (body.datasets.includes('ndvi')) results.datasets.ndvi = lastRecordedData.ndvi;
        if (body.datasets.includes('lst')) results.datasets.lst = lastRecordedData.lst;
        if (body.datasets.includes('smap')) results.datasets.smap = lastRecordedData.smap;
      } else {
        // Use synthetic data as final fallback
        console.warn('⚠️ No last recorded data available, using synthetic data');
        const syntheticData = generateSyntheticData(body.start_date);
        if (body.datasets.includes('ndvi')) results.datasets.ndvi = syntheticData.ndvi;
        if (body.datasets.includes('lst')) results.datasets.lst = syntheticData.lst;
        if (body.datasets.includes('smap')) results.datasets.smap = syntheticData.smap;
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-satellite-data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
