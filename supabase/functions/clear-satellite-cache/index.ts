import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClearCacheRequest {
  game_session_id?: string;
  older_than_hours?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const body: ClearCacheRequest = await req.json();
    
    console.log('🗑️ Clearing satellite data cache...');

    let query = supabaseClient.from('satellite_data').delete();

    // If specific session, delete only that session's data
    if (body.game_session_id) {
      query = query.eq('game_session_id', body.game_session_id);
      console.log(`Clearing data for session: ${body.game_session_id}`);
    } 
    // If time-based, delete old data
    else if (body.older_than_hours) {
      const cutoffDate = new Date(Date.now() - body.older_than_hours * 60 * 60 * 1000).toISOString();
      query = query.lt('created_at', cutoffDate);
      console.log(`Clearing data older than ${body.older_than_hours} hours (before ${cutoffDate})`);
    }
    // Otherwise clear all user's data
    else {
      console.log('Clearing all satellite data for authenticated user');
    }

    const { error, count } = await query;

    if (error) {
      throw error;
    }

    console.log(`✅ Cleared ${count || 0} satellite data records`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        records_deleted: count || 0,
        message: 'Satellite data cache cleared successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error clearing satellite cache:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
