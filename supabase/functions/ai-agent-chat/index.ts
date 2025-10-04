import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, includeData, location, dateRange } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let dataContext = "";
    
    // If user wants data analysis, fetch satellite and weather data
    if (includeData && location) {
      console.log("Fetching satellite and weather data for analysis...");
      
      try {
        // Fetch satellite data
        const satelliteResponse = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/fetch-satellite-data`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            },
            body: JSON.stringify({
              latitude: location.lat,
              longitude: location.lon,
              startDate: dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              endDate: dateRange?.end || new Date().toISOString().split('T')[0],
            }),
          }
        );

        // Fetch weather data
        const weatherResponse = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/fetch-weather-data`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            },
            body: JSON.stringify({
              latitude: location.lat,
              longitude: location.lon,
              startDate: dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              endDate: dateRange?.end || new Date().toISOString().split('T')[0],
            }),
          }
        );

        const satelliteData = await satelliteResponse.json();
        const weatherData = await weatherResponse.json();

        dataContext = `\n\nRECENT SATELLITE & WEATHER DATA for location (${location.lat}, ${location.lon}):\n`;
        dataContext += `Satellite Data: ${JSON.stringify(satelliteData, null, 2)}\n`;
        dataContext += `Weather Data: ${JSON.stringify(weatherData, null, 2)}\n`;
        dataContext += `\nUse this data to provide specific, data-driven insights and recommendations.`;
      } catch (error) {
        console.error("Error fetching data:", error);
        dataContext = "\n\nNote: Unable to fetch real-time data, providing general advice.";
      }
    }

    const systemPrompt = `You are Terra AI, an expert agricultural advisor specializing in precision farming and satellite data analysis. You help farmers make data-driven decisions about:

- Crop health monitoring using NDVI (Normalized Difference Vegetation Index)
- Soil moisture analysis from SMAP data
- Land surface temperature monitoring
- Weather patterns and their impact on farming
- Irrigation recommendations
- Crop yield predictions
- Environmental sustainability

When analyzing data, provide:
1. Clear interpretation of satellite metrics (NDVI, soil moisture, temperature)
2. Actionable farming recommendations
3. Risk assessments based on current conditions
4. Historical trend analysis when available

Keep responses concise, practical, and farmer-friendly. Use simple language while maintaining technical accuracy.${dataContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: "Payment required, please add funds to your Lovable AI workspace.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
