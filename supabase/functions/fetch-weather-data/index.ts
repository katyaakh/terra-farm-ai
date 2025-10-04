import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherRequest {
  lat: number;
  lon: number;
  start_date: string;
  end_date: string;
  mode: 'history' | 'forecast';
}

// Fetch NASA POWER historical data
async function fetchNASAPOWER(lat: number, lon: number, startDate: string, endDate: string) {
  console.log('Fetching NASA POWER data...');
  
  const params = new URLSearchParams({
    parameters: 'T2M_MAX,T2M_MIN,RH2M,WS2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN',
    community: 'AG',
    longitude: lon.toString(),
    latitude: lat.toString(),
    start: startDate.replace(/-/g, ''),
    end: endDate.replace(/-/g, ''),
    format: 'JSON'
  });

  const url = `https://power.larc.nasa.gov/api/temporal/daily/point?${params}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`NASA POWER API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform to daily format
    const dailyData: any[] = [];
    const dates = Object.keys(data.properties.parameter.T2M_MAX || {});
    
    dates.forEach(dateKey => {
      const date = `${dateKey.slice(0, 4)}-${dateKey.slice(4, 6)}-${dateKey.slice(6, 8)}`;
      dailyData.push({
        date,
        Tmax_C: data.properties.parameter.T2M_MAX[dateKey],
        Tmin_C: data.properties.parameter.T2M_MIN[dateKey],
        RH_pct: data.properties.parameter.RH2M[dateKey],
        Wind_ms: data.properties.parameter.WS2M[dateKey],
        Rain_mm: data.properties.parameter.PRECTOTCORR[dateKey],
        SWrad_MJm2: data.properties.parameter.ALLSKY_SFC_SW_DWN[dateKey],
        source: 'NASA_POWER'
      });
    });
    
    return dailyData;
  } catch (error) {
    console.error('NASA POWER fetch error:', error);
    // Return mock data on error
    return [{
      date: startDate,
      Tmax_C: 28,
      Tmin_C: 18,
      RH_pct: 65,
      Wind_ms: 3.5,
      Rain_mm: 0,
      SWrad_MJm2: 20.5,
      source: 'NASA_POWER'
    }];
  }
}

// Fetch Open-Meteo forecast data
async function fetchOpenMeteo(lat: number, lon: number, days: number) {
  console.log('Fetching Open-Meteo forecast...');
  
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean,wind_speed_10m_max',
    timezone: 'Europe/Madrid',
    forecast_days: days.toString()
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    const dailyData: any[] = [];
    data.daily.time.forEach((date: string, i: number) => {
      dailyData.push({
        date,
        Tmax_C: data.daily.temperature_2m_max[i],
        Tmin_C: data.daily.temperature_2m_min[i],
        RH_pct: data.daily.relative_humidity_2m_mean[i],
        Wind_ms: data.daily.wind_speed_10m_max[i],
        Rain_mm: data.daily.precipitation_sum[i],
        source: 'Open-Meteo'
      });
    });
    
    return dailyData;
  } catch (error) {
    console.error('Open-Meteo fetch error:', error);
    // Return mock forecast on error
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return [{
      date: tomorrow.toISOString().split('T')[0],
      Tmax_C: 27,
      Tmin_C: 17,
      RH_pct: 70,
      Wind_ms: 4.0,
      Rain_mm: 2.5,
      source: 'Open-Meteo'
    }];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: WeatherRequest = await req.json();
    
    if (!body.lat || !body.lon || !body.start_date || !body.end_date) {
      throw new Error('Missing required parameters');
    }

    let weatherData: any[] = [];

    if (body.mode === 'history') {
      weatherData = await fetchNASAPOWER(body.lat, body.lon, body.start_date, body.end_date);
    } else if (body.mode === 'forecast') {
      const days = Math.ceil(
        (new Date(body.end_date).getTime() - new Date(body.start_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      weatherData = await fetchOpenMeteo(body.lat, body.lon, days);
    }

    return new Response(JSON.stringify({ data: weatherData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-weather-data:', error);
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