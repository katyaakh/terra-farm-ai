import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SatelliteDataRow {
  date: string;
  NDVI_obs?: number;
  NDVI_syn: number;
  NDVI_is_synth: boolean;
  NDVI_age_days: number;
  LST_obs?: number;
  LST_syn: number;
  LST_is_synth: boolean;
  LST_age_days: number;
  SM_obs?: number;
  SM_syn: number;
  SM_is_synth: boolean;
  SM_age_days: number;
  Tmax_C?: number;
  Tmin_C?: number;
  RH_pct?: number;
  Wind_ms?: number;
  Rain_mm?: number;
  SWrad_MJm2?: number;
}

interface UploadRequest {
  game_session_id?: string; // Optional - will auto-detect if not provided
  satellite_data: SatelliteDataRow[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Verify authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const body: UploadRequest = await req.json();
    
    // Auto-detect game session if not provided
    let gameSessionId = body.game_session_id;
    
    if (!gameSessionId) {
      console.log('No game_session_id provided, finding active session for user:', user.id);
      
      const { data: activeSession, error: findError } = await supabaseClient
        .from('game_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('completed', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (findError || !activeSession) {
        throw new Error('No active game session found. Please start a game first.');
      }
      
      gameSessionId = activeSession.id;
      console.log(`Auto-detected game session: ${gameSessionId}`);
    } else {
      console.log(`Using provided game_session_id: ${gameSessionId}`);
      
      // Verify the game session belongs to the user
      const { data: session, error: sessionError } = await supabaseClient
        .from('game_sessions')
        .select('id, user_id')
        .eq('id', gameSessionId)
        .single();

      if (sessionError || !session || session.user_id !== user.id) {
        throw new Error('Game session not found or unauthorized');
      }
    }

    // Delete existing satellite data for this session
    const { error: deleteError } = await supabaseClient
      .from('satellite_data')
      .delete()
      .eq('game_session_id', gameSessionId);

    if (deleteError) {
      console.error('Error deleting old data:', deleteError);
      throw deleteError;
    }

    // Transform and insert new satellite data
    const satelliteRecords = body.satellite_data.map(row => ({
      game_session_id: gameSessionId,
      date: row.date,
      ndvi: row.NDVI_obs || row.NDVI_syn,
      lst_kelvin: row.LST_syn ? row.LST_syn + 273.15 : null, // Convert Celsius to Kelvin
      lst_celsius: row.LST_obs || row.LST_syn,
      soil_moisture: row.SM_obs || row.SM_syn,
      is_interpolated: row.NDVI_is_synth || row.LST_is_synth || row.SM_is_synth,
      data_age_days: Math.max(row.NDVI_age_days || 0, row.LST_age_days || 0, row.SM_age_days || 0),
      data_source: 'MODIS_REAL',
      quality_flags: {
        ndvi_interpolated: row.NDVI_is_synth,
        ndvi_age: row.NDVI_age_days,
        lst_interpolated: row.LST_is_synth,
        lst_age: row.LST_age_days,
        sm_interpolated: row.SM_is_synth,
        sm_age: row.SM_age_days,
        has_observed_ndvi: !!row.NDVI_obs,
        has_observed_lst: !!row.LST_obs,
        has_observed_sm: !!row.SM_obs,
      }
    }));

    const { data, error: insertError } = await supabaseClient
      .from('satellite_data')
      .insert(satelliteRecords)
      .select();

    if (insertError) {
      console.error('Error inserting satellite data:', insertError);
      throw insertError;
    }

    console.log(`✅ Uploaded ${satelliteRecords.length} satellite data records`);

    return new Response(
      JSON.stringify({
        success: true,
        records_uploaded: satelliteRecords.length,
        message: 'Real satellite data uploaded successfully',
        data_summary: {
          date_range: {
            start: satelliteRecords[0]?.date,
            end: satelliteRecords[satelliteRecords.length - 1]?.date,
          },
          interpolated_count: satelliteRecords.filter(r => r.is_interpolated).length,
          observed_count: satelliteRecords.filter(r => !r.is_interpolated).length,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in upload-satellite-data:', error);
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
