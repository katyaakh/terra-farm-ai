import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { crop } = await req.json();
    
    if (!crop) {
      throw new Error('Crop name is required');
    }

    console.log(`Fetching optimal conditions for: ${crop}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `What are the optimal growing conditions for ${crop}? Provide specific ranges for:
1. Soil moisture (as percentage, 0-100%)
2. Temperature (in Celsius)
3. NDVI (Normalized Difference Vegetation Index, 0-1 scale)

Respond with precise numerical ranges based on agricultural research.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: 'You are an agricultural expert. Provide optimal growing conditions with precise numerical ranges.' 
          },
          { role: 'user', content: prompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'provide_optimal_conditions',
              description: 'Return optimal growing conditions for a crop',
              parameters: {
                type: 'object',
                properties: {
                  soil_moisture: {
                    type: 'object',
                    properties: {
                      min: { type: 'number', description: 'Minimum soil moisture percentage (0-100)' },
                      max: { type: 'number', description: 'Maximum soil moisture percentage (0-100)' }
                    },
                    required: ['min', 'max']
                  },
                  temperature: {
                    type: 'object',
                    properties: {
                      min: { type: 'number', description: 'Minimum temperature in Celsius' },
                      max: { type: 'number', description: 'Maximum temperature in Celsius' }
                    },
                    required: ['min', 'max']
                  },
                  ndvi: {
                    type: 'object',
                    properties: {
                      min: { type: 'number', description: 'Minimum NDVI value (0-1)' },
                      max: { type: 'number', description: 'Maximum NDVI value (0-1)' }
                    },
                    required: ['min', 'max']
                  }
                },
                required: ['soil_moisture', 'temperature', 'ndvi']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'provide_optimal_conditions' } }
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required, please add funds to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call response from AI');
    }

    const conditions = JSON.parse(toolCall.function.arguments);

    console.log('✅ Optimal conditions retrieved:', conditions);

    return new Response(
      JSON.stringify({
        crop,
        optimal_conditions: conditions,
        source: 'Agricultural Research (AI-assisted)'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-optimal-crop-conditions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
