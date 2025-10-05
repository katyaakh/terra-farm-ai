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

// Generate synthetic satellite data for each day in the range
// Base values: NDVI=0.4656, Temp=21°C, Soil Moisture=0.516682
// Each day varies by ±10% randomly
function generateSatelliteDataForPeriod(startDate: string, endDate: string) {
  const data = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Base values as specified
  const baseNdvi = 0.4656;
  const baseTempCelsius = 21;
  const baseTempKelvin = baseTempCelsius + 273.15; // 294.15K
  const baseSoilMoisture = 0.516682;
  
  // Iterate through each day
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    
    // Apply ±10% random variation for each parameter
    const ndviVariation = (Math.random() - 0.5) * 0.2; // ±10% = ±0.1 relative
    const ndvi = baseNdvi * (1 + ndviVariation);
    
    const lstVariation = (Math.random() - 0.5) * 0.2; // ±10%
    const lst = baseTempKelvin * (1 + lstVariation);
    
    const moistureVariation = (Math.random() - 0.5) * 0.2; // ±10%
    const soilMoisture = baseSoilMoisture * (1 + moistureVariation);
    
    data.push({
      date: dateStr,
      ndvi: Number(ndvi.toFixed(4)),
      lst_kelvin: Number(lst.toFixed(2)),
      lst_celsius: Number((lst - 273.15).toFixed(2)),
      soil_moisture: Number(soilMoisture.toFixed(6)),
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