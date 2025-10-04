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

// Fetch MODIS NDVI data - SIMULATION MODE
// Real data should be uploaded via upload-satellite-data function from Google Colab
async function fetchMODISNDVI(geometry: any, startDate: string, endDate: string) {
  console.log('⚠️ Using simulated MODIS NDVI data (upload real data via upload-satellite-data)');
  
  return {
    dataset: 'MODIS/061/MOD13Q1 (SIMULATED)',
    values: [
      { date: startDate, value: 0.65, age_days: 0, is_simulated: true },
      { date: endDate, value: 0.72, age_days: 0, is_simulated: true }
    ],
    scale: 0.0001,
    unit: 'NDVI',
    note: 'This is simulated data. Upload real GEE data using the upload-satellite-data endpoint.'
  };
}

// Fetch MODIS LST data - SIMULATION MODE
async function fetchMODISLST(geometry: any, startDate: string, endDate: string) {
  console.log('⚠️ Using simulated MODIS LST data (upload real data via upload-satellite-data)');
  
  return {
    dataset: 'MODIS/061/MOD11A2 (SIMULATED)',
    values: [
      { date: startDate, value: 298.15, age_days: 0, is_simulated: true }, // Kelvin
      { date: endDate, value: 301.15, age_days: 0, is_simulated: true }
    ],
    conversion: '°C = LST * 0.02 - 273.15',
    unit: 'K',
    note: 'This is simulated data. Upload real GEE data using the upload-satellite-data endpoint.'
  };
}

// Fetch SMAP Soil Moisture - SIMULATION MODE
async function fetchSMAP(geometry: any, startDate: string, endDate: string) {
  console.log('⚠️ Using simulated SMAP data (upload real data via upload-satellite-data)');
  
  return {
    dataset: 'NASA/SMAP/SPL3SMP_E/006 (SIMULATED)',
    values: [
      { date: startDate, value: 0.35, age_days: 0, is_simulated: true }, // m³/m³
      { date: endDate, value: 0.42, age_days: 0, is_simulated: true }
    ],
    unit: 'm³/m³',
    note: 'This is simulated data. Upload real GEE data using the upload-satellite-data endpoint.'
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

    const geometry = createSquareGeometry(body.lat, body.lon, body.extent_m);
    const results: any = {
      geometry,
      datasets: {}
    };

    // Fetch requested datasets
    if (body.datasets.includes('ndvi')) {
      results.datasets.ndvi = await fetchMODISNDVI(geometry, body.start_date, body.end_date);
    }
    
    if (body.datasets.includes('lst')) {
      results.datasets.lst = await fetchMODISLST(geometry, body.start_date, body.end_date);
    }
    
    if (body.datasets.includes('smap')) {
      results.datasets.smap = await fetchSMAP(geometry, body.start_date, body.end_date);
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