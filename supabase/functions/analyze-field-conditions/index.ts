import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  lat: number;
  lon: number;
  area_m2: number;
  crop: string;
  start_date?: string;
  end_date?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: AnalysisRequest = await req.json();
    
    if (!body.lat || !body.lon || !body.area_m2 || !body.crop) {
      throw new Error('Missing required parameters: lat, lon, area_m2, crop');
    }

    console.log(`🔍 Analyzing field: ${body.crop} at (${body.lat}, ${body.lon}), ${body.area_m2}m²`);

    // Calculate date range (default: last 7 days)
    const endDate = body.end_date || new Date().toISOString().split('T')[0];
    const startDate = body.start_date || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Calculate square extent from area
    const extent_m = Math.sqrt(body.area_m2);

    // Step 1: Fetch real satellite data
    console.log('Step 1: Fetching satellite data...');
    const satelliteResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/fetch-satellite-data`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
        },
        body: JSON.stringify({
          lat: body.lat,
          lon: body.lon,
          extent_m,
          start_date: startDate,
          end_date: endDate,
          datasets: ['ndvi', 'lst', 'smap']
        })
      }
    );

    if (!satelliteResponse.ok) {
      throw new Error('Failed to fetch satellite data');
    }

    const satelliteData = await satelliteResponse.json();
    console.log('✅ Satellite data received');

    // Step 2: Get optimal conditions for crop
    console.log('Step 2: Getting optimal crop conditions...');
    const optimalResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/get-optimal-crop-conditions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
        },
        body: JSON.stringify({ crop: body.crop })
      }
    );

    if (!optimalResponse.ok) {
      throw new Error('Failed to get optimal conditions');
    }

    const optimalData = await optimalResponse.json();
    console.log('✅ Optimal conditions received');

    // Step 3: Extract latest real values
    const ndviValues = satelliteData.datasets?.ndvi?.values || [];
    const lstValues = satelliteData.datasets?.lst?.values || [];
    const smapValues = satelliteData.datasets?.smap?.values || [];

    const latestNdvi = ndviValues[ndviValues.length - 1]?.value || 0;
    const latestLst = lstValues[lstValues.length - 1]?.value || 273.15;
    const latestSoilMoisture = smapValues[smapValues.length - 1]?.value || 0;

    // Convert LST from Kelvin to Celsius
    const temperatureCelsius = latestLst - 273.15;
    const soilMoisturePercent = latestSoilMoisture * 100;

    // Step 4: Compare with optimal conditions
    const optimal = optimalData.optimal_conditions;

    const calculateStatus = (value: number, min: number, max: number) => {
      if (value >= min && value <= max) return 'green';
      const deviation = value < min ? (min - value) / min : (value - max) / max;
      return deviation <= 0.1 ? 'yellow' : 'red';
    };

    const soilMoistureStatus = calculateStatus(
      soilMoisturePercent,
      optimal.soil_moisture.min,
      optimal.soil_moisture.max
    );
    const temperatureStatus = calculateStatus(
      temperatureCelsius,
      optimal.temperature.min,
      optimal.temperature.max
    );
    const ndviStatus = calculateStatus(
      latestNdvi,
      optimal.ndvi.min,
      optimal.ndvi.max
    );

    const comparison = {
      soil_moisture: {
        real: soilMoisturePercent.toFixed(1),
        optimal: `${optimal.soil_moisture.min}-${optimal.soil_moisture.max}%`,
        status: soilMoistureStatus
      },
      temperature: {
        real: temperatureCelsius.toFixed(1),
        optimal: `${optimal.temperature.min}-${optimal.temperature.max}°C`,
        status: temperatureStatus
      },
      ndvi: {
        real: latestNdvi.toFixed(2),
        optimal: `${optimal.ndvi.min}-${optimal.ndvi.max}`,
        status: ndviStatus
      }
    };

    // Step 5: Generate Terra AI recommendation
    console.log('Step 3: Generating Terra AI recommendation...');
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const statusSummary = `
Soil Moisture: ${comparison.soil_moisture.status === 'green' ? '✅ Optimal' : comparison.soil_moisture.status === 'yellow' ? '⚠️ Slight deviation' : '🚨 Out of range'}
Temperature: ${comparison.temperature.status === 'green' ? '✅ Optimal' : comparison.temperature.status === 'yellow' ? '⚠️ Slight deviation' : '🚨 Out of range'}
NDVI: ${comparison.ndvi.status === 'green' ? '✅ Optimal' : comparison.ndvi.status === 'yellow' ? '⚠️ Slight deviation' : '🚨 Out of range'}
`.trim();

    const aiPrompt = `
Field Analysis for ${body.crop}:
- Soil Moisture: ${comparison.soil_moisture.real}% (Optimal: ${comparison.soil_moisture.optimal})
- Temperature: ${comparison.temperature.real}°C (Optimal: ${comparison.temperature.optimal})
- NDVI: ${comparison.ndvi.real} (Optimal: ${comparison.ndvi.optimal})

Status: ${statusSummary}

Provide ONE specific, actionable recommendation (1-2 sentences max). If everything is optimal, acknowledge it briefly.
`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are Terra AI, an expert agricultural advisor. Provide concise, actionable farming recommendations.' 
          },
          { role: 'user', content: aiPrompt }
        ]
      })
    });

    if (!aiResponse.ok) {
      console.error('AI recommendation failed, using fallback');
    }

    let recommendation = 'Analysis complete. Check the comparison table for details.';
    
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      recommendation = aiData.choices?.[0]?.message?.content || recommendation;
    }

    console.log('✅ Terra AI recommendation generated');

    // Determine if data has interpolation or age issues
    const hasInterpolatedData = [...ndviValues, ...lstValues, ...smapValues].some((v: any) => v.is_simulated || v.is_interpolated);
    const oldestDataAge = Math.max(
      ...ndviValues.map((v: any) => v.age_days || 0),
      ...lstValues.map((v: any) => v.age_days || 0),
      ...smapValues.map((v: any) => v.age_days || 0)
    );

    // Return complete analysis
    return new Response(
      JSON.stringify({
        comparison,
        geometry: satelliteData.geometry,
        terra_ai_recommendation: recommendation,
        data_quality: {
          has_interpolated_data: hasInterpolatedData,
          oldest_data_age_days: oldestDataAge,
          data_sources: {
            ndvi: satelliteData.datasets?.ndvi?.data_source || 'UNKNOWN',
            lst: satelliteData.datasets?.lst?.data_source || 'UNKNOWN',
            smap: satelliteData.datasets?.smap?.data_source || 'UNKNOWN'
          }
        },
        analysis_date: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-field-conditions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
