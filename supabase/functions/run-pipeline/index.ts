import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PipelineRequest {
  lat: number;
  lon: number;
  extent_m: number;
  crop: string;
  planting_date: string;
  mode: 'last_year' | 'realtime';
  last_year_days?: number;
  forecast_days?: number;
}

interface TimelineRow {
  date: string;
  NDVI?: number;
  NDVI_age_days?: number;
  LST_C?: number;
  LST_age_days?: number;
  SM_m3m3?: number;
  SM_age_days?: number;
  Tmax_C?: number;
  Tmin_C?: number;
  RH_pct?: number;
  Wind_ms?: number;
  Rain_mm?: number;
  SWrad_MJm2?: number;
  GDD?: number;
  GDD_cum?: number;
  stage?: string;
  source_meteo?: string;
}

// Calculate GDD for tomato (base 10°C, cap 30°C)
function calculateGDD(tmax: number, tmin: number): number {
  const tmean = (tmax + tmin) / 2;
  const cappedMean = Math.min(tmean, 30);
  return Math.max(0, cappedMean - 10);
}

// Determine growth stage for tomato
function getStage(gddCum: number): string {
  if (gddCum < 400) return 'establishment';
  if (gddCum < 900) return 'vegetative';
  if (gddCum < 1200) return 'flowering_set';
  return 'ripening';
}

// Apply MODIS NDVI scaling
function scaleNDVI(raw: number): number {
  return raw * 0.0001;
}

// Convert MODIS LST from Kelvin to Celsius
function convertLST(kelvin: number): number {
  return kelvin * 0.02 - 273.15;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: PipelineRequest = await req.json();
    
    // Validate inputs
    if (!body.lat || !body.lon || !body.extent_m || !body.planting_date) {
      throw new Error('Missing required parameters');
    }

    const lastYearDays = body.last_year_days || 120;
    const forecastDays = body.forecast_days || 7;
    
    // Calculate date ranges
    const plantingDate = new Date(body.planting_date);
    const today = new Date();
    
    let startDate: string, endDate: string;
    
    if (body.mode === 'last_year') {
      startDate = body.planting_date;
      endDate = new Date(plantingDate.getTime() + lastYearDays * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];
    } else {
      startDate = body.planting_date;
      endDate = new Date(today.getTime() + forecastDays * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];
    }

    console.log(`Running pipeline for ${body.mode} mode from ${startDate} to ${endDate}`);

    // Fetch satellite data
    const satelliteResponse = await supabase.functions.invoke('fetch-satellite-data', {
      body: {
        lat: body.lat,
        lon: body.lon,
        extent_m: body.extent_m,
        start_date: startDate,
        end_date: endDate,
        datasets: ['ndvi', 'lst', 'smap']
      }
    });

    // Fetch weather data
    const weatherResponse = await supabase.functions.invoke('fetch-weather-data', {
      body: {
        lat: body.lat,
        lon: body.lon,
        start_date: startDate,
        end_date: endDate,
        mode: body.mode === 'last_year' ? 'history' : 'forecast'
      }
    });

    const satelliteData = satelliteResponse.data;
    const weatherData = weatherResponse.data?.data || [];

    // Build timeline
    const timeline: TimelineRow[] = [];
    let gddCumulative = 0;

    weatherData.forEach((weather: any) => {
      const gdd = calculateGDD(weather.Tmax_C, weather.Tmin_C);
      gddCumulative += gdd;
      
      const row: TimelineRow = {
        date: weather.date,
        Tmax_C: weather.Tmax_C,
        Tmin_C: weather.Tmin_C,
        RH_pct: weather.RH_pct,
        Wind_ms: weather.Wind_ms,
        Rain_mm: weather.Rain_mm,
        SWrad_MJm2: weather.SWrad_MJm2,
        GDD: gdd,
        GDD_cum: gddCumulative,
        stage: getStage(gddCumulative),
        source_meteo: weather.source
      };

      // Add satellite data (simplified - in production would interpolate)
      if (satelliteData?.datasets?.ndvi) {
        row.NDVI = scaleNDVI(satelliteData.datasets.ndvi.values[0]?.value || 0.65);
        row.NDVI_age_days = 0;
      }
      
      if (satelliteData?.datasets?.lst) {
        row.LST_C = convertLST(satelliteData.datasets.lst.values[0]?.value || 298);
        row.LST_age_days = 0;
      }
      
      if (satelliteData?.datasets?.smap) {
        row.SM_m3m3 = satelliteData.datasets.smap.values[0]?.value || 0.35;
        row.SM_age_days = 0;
      }

      timeline.push(row);
    });

    const result = {
      field: {
        lat: body.lat,
        lon: body.lon,
        extent_m: body.extent_m,
        crop: body.crop,
        planting_date: body.planting_date
      },
      timeline,
      meta: {
        mode: body.mode,
        datasets: {
          ndvi: 'MODIS/061/MOD13Q1',
          lst: 'MODIS/061/MOD11A2',
          smap: 'NASA/SMAP/SPL3SMP_E/006'
        },
        weather_sources: body.mode === 'last_year' 
          ? ['NASA_POWER']
          : ['Open-Meteo']
      }
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in run-pipeline:', error);
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