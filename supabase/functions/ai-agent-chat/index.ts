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
    const { message } = await req.json();

    // Preprogrammed response
    const preprogrammedMessage = "👨‍🌾🤖👨‍🚀 Your tomatoes look healthy!\nAll parameters are within the optimal range.\nIt looks like it will rain in your area in 4 days — stay tuned and plan your irrigation accordingly.\nGreat job! 🌱 ";

    // Create a streaming response with the preprogrammed message
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const chunk = {
          choices: [{
            delta: { content: preprogrammedMessage },
            index: 0,
          }],
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
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
