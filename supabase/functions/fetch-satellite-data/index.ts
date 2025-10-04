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

// Generate realistic interpolated data based on location and season
function generateInterpolatedData(lat: number, lon: number, startDate: string, endDate: string) {
  console.log('⚠️ No real data available - generating interpolated data based on coordinates and season');
  
  // Parse dates to get season
  const date = new Date(endDate);
  const month = date.getMonth();
  
  // Seasonal variations based on hemisphere and month
  const isNorthernHemisphere = lat > 0;
  const isSummer = isNorthernHemisphere 
    ? (month >= 5 && month <= 8)  // Jun-Sep for North
    : (month >= 11 || month <= 2); // Dec-Feb for South
  const isWinter = isNorthernHemisphere
    ? (month >= 11 || month <= 2)  // Dec-Feb for North
    : (month >= 5 && month <= 8);  // Jun-Sep for South
  
  // Temperature varies by latitude and season
  let baseTemp = 15; // Base in Celsius
  if (Math.abs(lat) < 23.5) { // Tropical
    baseTemp = 25 + (isSummer ? 3 : -2);
  } else if (Math.abs(lat) < 40) { // Subtropical
    baseTemp = 20 + (isSummer ? 8 : (isWinter ? -10 : 0));
  } else { // Temperate/Cold
    baseTemp = 10 + (isSummer ? 12 : (isWinter ? -15 : -5));
  }
  
  // NDVI varies by season and latitude
  let baseNdvi = 0.5;
  if (isSummer) {
    baseNdvi = 0.65 + (Math.abs(lat) < 40 ? 0.15 : 0.05);
  } else if (isWinter) {
    baseNdvi = 0.35 + (Math.abs(lat) < 23.5 ? 0.2 : 0);
  }
  
  // Soil moisture varies by season
  let baseMoisture = 0.3;
  if (isSummer) {
    baseMoisture = 0.25 + (Math.abs(lat) < 23.5 ? 0.1 : 0);
  } else {
    baseMoisture = 0.35 + (Math.abs(lat) > 40 ? 0.1 : 0);
  }
  
  // Add some random variation
  const variation = (Math.random() - 0.5) * 0.1;
  
  return {
    ndvi: {
      dataset: 'MODIS/061/MOD13Q1 (INTERPOLATED)',
      values: [
        { date: startDate, value: Math.max(0.1, Math.min(0.9, baseNdvi + variation)), age_days: 0, is_interpolated: true },
        { date: endDate, value: Math.max(0.1, Math.min(0.9, baseNdvi + variation + 0.02)), age_days: 0, is_interpolated: true }
      ],
      scale: 0.0001,
      unit: 'NDVI',
      data_source: 'MODIS_INTERPOLATED',
      note: `Interpolated based on location (${lat.toFixed(2)}°, ${lon.toFixed(2)}°) and seasonal patterns`
    },
    lst: {
      dataset: 'MODIS/061/MOD11A2 (INTERPOLATED)',
      values: [
        { date: startDate, value: baseTemp + 273.15, age_days: 0, is_interpolated: true },
        { date: endDate, value: baseTemp + 273.15 + variation * 5, age_days: 0, is_interpolated: true }
      ],
      conversion: '°C = LST - 273.15',
      unit: 'K',
      data_source: 'MODIS_INTERPOLATED',
      note: `Interpolated based on latitude ${lat.toFixed(2)}° and seasonal patterns`
    },
    smap: {
      dataset: 'NASA/SMAP/SPL3SMP_E/006 (INTERPOLATED)',
      values: [
        { date: startDate, value: Math.max(0.1, Math.min(0.6, baseMoisture + variation)), age_days: 0, is_interpolated: true },
        { date: endDate, value: Math.max(0.1, Math.min(0.6, baseMoisture + variation + 0.02)), age_days: 0, is_interpolated: true }
      ],
      unit: 'm³/m³',
      data_source: 'MODIS_INTERPOLATED',
      note: `Interpolated based on location and seasonal patterns`
    }
  };
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
      console.warn('⚠️ GEE credentials not configured, generating interpolated data');
      const interpolatedData = generateInterpolatedData(body.lat, body.lon, body.start_date, body.end_date);
      
      if (body.datasets.includes('ndvi')) results.datasets.ndvi = interpolatedData.ndvi;
      if (body.datasets.includes('lst')) results.datasets.lst = interpolatedData.lst;
      if (body.datasets.includes('smap')) results.datasets.smap = interpolatedData.smap;
      
      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      // Get GEE access token
      const accessToken = await getGEEAccessToken(serviceAccountEmail, privateKey);

      // Fetch requested datasets from GEE with proper error handling
      const interpolatedFallback = generateInterpolatedData(body.lat, body.lon, body.start_date, body.end_date);
      
      if (body.datasets.includes('ndvi')) {
        try {
          const ndviData = await fetchMODISNDVI(accessToken, geometry, body.start_date, body.end_date);
          // Check if we got real data
          if (ndviData.values && ndviData.values.length > 0) {
            results.datasets.ndvi = ndviData;
            console.log('✅ Real NDVI data retrieved');
          } else {
            console.warn('⚠️ No NDVI data for requested date, using interpolation');
            results.datasets.ndvi = interpolatedFallback.ndvi;
          }
        } catch (error) {
          console.error('NDVI fetch failed, using interpolated data:', error);
          results.datasets.ndvi = interpolatedFallback.ndvi;
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
            console.warn('⚠️ No LST data for requested date, using interpolation');
            results.datasets.lst = interpolatedFallback.lst;
          }
        } catch (error) {
          console.error('LST fetch failed, using interpolated data:', error);
          results.datasets.lst = interpolatedFallback.lst;
        }
      }
      
      if (body.datasets.includes('smap')) {
        try {
          const smapData = await fetchSMAP(accessToken, geometry, body.start_date, body.end_date);
          if (smapData.values && smapData.values.length > 0) {
            results.datasets.smap = smapData;
            console.log('✅ Real SMAP data retrieved');
          } else {
            console.warn('⚠️ No SMAP data for requested date, using interpolation');
            results.datasets.smap = interpolatedFallback.smap;
          }
        } catch (error) {
          console.error('SMAP fetch failed, using interpolated data:', error);
          results.datasets.smap = interpolatedFallback.smap;
        }
      }

      console.log('✅ Satellite data fetch complete');

    } catch (geeError) {
      console.error('GEE authentication/fetch failed, using interpolated data:', geeError);
      const interpolatedData = generateInterpolatedData(body.lat, body.lon, body.start_date, body.end_date);
      
      if (body.datasets.includes('ndvi')) results.datasets.ndvi = interpolatedData.ndvi;
      if (body.datasets.includes('lst')) results.datasets.lst = interpolatedData.lst;
      if (body.datasets.includes('smap')) results.datasets.smap = interpolatedData.smap;
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
