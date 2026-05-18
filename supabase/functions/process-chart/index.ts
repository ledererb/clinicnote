import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { processAmbulansInternally } from "./process-ambulans-internal.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const formData = await req.formData();
    const audio = formData.get("audio") as File;
    const jobId = formData.get("job_id") as string;
    const overrideTranscript = formData.get("override_transcript") as string | undefined;

    if (!audio || !jobId) {
      return new Response(
        JSON.stringify({ error: "Hiányzó kötelező mezők: hangfájl vagy job_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    const elevenlabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");

    const apiKeys = { openai: openaiApiKey || "", elevenlabs: elevenlabsApiKey || "", anthropic: anthropicApiKey || "" };
    
    const backgroundProcessing = processAmbulansInternally(jobId, audio, supabaseAdmin, apiKeys, overrideTranscript);

    // Use EdgeRuntime.waitUntil to process in background
    // @ts-ignore
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(backgroundProcessing);
    } else {
      await backgroundProcessing;
    }

    // Return immediately to frontend
    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in process-chart function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Ismeretlen hiba történt a hangfelvétel feldolgozásakor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
