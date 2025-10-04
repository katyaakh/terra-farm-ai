import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InterpretRequest {
  timeline: any[];
  crop: string;
  current_stage: string;
  images?: string[]; // URLs or base64
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const body: InterpretRequest = await req.json();
    
    if (!body.timeline || !body.crop) {
      throw new Error('Missing required parameters');
    }

    // Get latest data point
    const latest = body.timeline[body.timeline.length - 1];
    
    // Prepare system prompt
    const systemPrompt = `You are an agricultural AI assistant specializing in precision farming using NASA satellite data and weather information.

Your role is to analyze crop growth data and provide actionable farming recommendations based on:
- MODIS NDVI (vegetation health)
- MODIS LST (land surface temperature)
- SMAP soil moisture
- Weather data (temperature, humidity, rainfall)
- GDD (Growing Degree Days) and growth stage

Provide clear, concise recommendations for farmers focusing on:
1. Current crop health assessment
2. Immediate actions needed (irrigation, fertilization, etc.)
3. Predicted challenges in the next 7 days
4. Optimization suggestions

Keep responses practical and farmer-friendly.`;

    // Prepare user prompt with data
    const userPrompt = `Analyze this ${body.crop} crop data:

Current Stage: ${body.current_stage}
Latest Measurements:
- Date: ${latest.date}
- NDVI: ${latest.NDVI?.toFixed(2)} (${latest.NDVI_age_days} days old)
- Soil Moisture: ${(latest.SM_m3m3 * 100)?.toFixed(1)}%
- Temperature: ${latest.LST_C?.toFixed(1)}°C
- Air Temp Range: ${latest.Tmin_C}°C - ${latest.Tmax_C}°C
- Humidity: ${latest.RH_pct?.toFixed(0)}%
- Recent Rain: ${latest.Rain_mm?.toFixed(1)}mm
- GDD Accumulated: ${latest.GDD_cum?.toFixed(0)}

Recent 7-day trend:
${body.timeline.slice(-7).map(d => 
  `${d.date}: NDVI=${d.NDVI?.toFixed(2)}, SM=${(d.SM_m3m3 * 100)?.toFixed(0)}%, Rain=${d.Rain_mm}mm`
).join('\n')}

Provide farming recommendations.`;

    // Call Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const recommendation = data.choices[0].message.content;

    return new Response(
      JSON.stringify({
        recommendation,
        analyzed_data: {
          crop: body.crop,
          stage: body.current_stage,
          latest_metrics: latest,
          model: 'google/gemini-2.5-flash'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in interpret-data:', error);
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