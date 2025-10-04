import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StoreSatelliteRequest {
  game_session_id: string;
  lat: number;
  lon: number;
  start_date: string;
  end_date: string;
}

// Generate mock satellite data for each day in the range
function generateSatelliteDataForPeriod(startDate: string, endDate: string) {
  const data = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Iterate through each day
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    
    // Generate realistic satellite data
    // NDVI: Normalized Difference Vegetation Index (0-1, healthy vegetation ~0.6-0.9)
    const baseNdvi = 0.65;
    const ndviVariation = (Math.random() - 0.5) * 0.15; // ±0.075
    const ndvi = Math.max(0.3, Math.min(0.95, baseNdvi + ndviVariation));
    
    // LST: Land Surface Temperature in Kelvin (typical range 280-320K for temperate climates)
    const baseLst = 295; // ~22°C
    const lstVariation = (Math.random() - 0.5) * 20; // ±10K
    const lst = baseLst + lstVariation;
    
    // Soil Moisture: volumetric water content (0-1, typical agricultural range 0.2-0.5)
    const baseSoilMoisture = 0.35;
    const moistureVariation = (Math.random() - 0.5) * 0.2; // ±0.1
    const soilMoisture = Math.max(0.1, Math.min(0.6, baseSoilMoisture + moistureVariation));
    
    data.push({
      date: dateStr,
      ndvi: Number(ndvi.toFixed(3)),
      lst_kelvin: Number(lst.toFixed(2)),
      lst_celsius: Number((lst - 273.15).toFixed(2)),
      soil_moisture: Number(soilMoisture.toFixed(3)),
      data_source: 'MODIS_SIMULATED'
    });
  }
  
  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const body: StoreSatelliteRequest = await req.json();
    console.log('Fetching satellite data for game session:', body.game_session_id);
    
    // Validate inputs
    if (!body.game_session_id || !body.lat || !body.lon || !body.start_date || !body.end_date) {
      throw new Error('Missing required parameters');
    }

    // Verify the game session belongs to the authenticated user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if game session exists and belongs to user
    const { data: gameSession, error: sessionError } = await supabase
      .from('game_sessions')
      .select('id, user_id')
      .eq('id', body.game_session_id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !gameSession) {
      throw new Error('Game session not found or unauthorized');
    }

    console.log('Generating satellite data from', body.start_date, 'to', body.end_date);
    
    // Generate satellite data for the entire period
    const satelliteData = generateSatelliteDataForPeriod(body.start_date, body.end_date);
    
    console.log(`Generated ${satelliteData.length} days of satellite data`);

    // Delete any existing satellite data for this game session
    const { error: deleteError } = await supabase
      .from('satellite_data')
      .delete()
      .eq('game_session_id', body.game_session_id);

    if (deleteError) {
      console.error('Error deleting old satellite data:', deleteError);
    }

    // Insert new satellite data
    const insertData = satelliteData.map(item => ({
      game_session_id: body.game_session_id,
      ...item
    }));

    const { data: insertedData, error: insertError } = await supabase
      .from('satellite_data')
      .insert(insertData)
      .select();

    if (insertError) {
      console.error('Error inserting satellite data:', insertError);
      throw insertError;
    }

    console.log(`Successfully stored ${insertedData?.length || 0} satellite data records`);

    return new Response(
      JSON.stringify({
        success: true,
        records_created: insertedData?.length || 0,
        data: satelliteData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in store-satellite-data:', error);
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