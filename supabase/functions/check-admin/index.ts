import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { deviceId } = await req.json();

    if (!deviceId || typeof deviceId !== "string" || deviceId.length > 128) {
      return new Response(
        JSON.stringify({ isAdmin: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const adminCode = Deno.env.get("ADMIN_INVITE_CODE");
    if (!adminCode) {
      return new Response(
        JSON.stringify({ isAdmin: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const { data } = await sb
      .from("invitation_codes")
      .select("code")
      .eq("device_id", deviceId)
      .eq("is_used", true)
      .limit(1);

    const isAdmin = data?.[0]?.code === adminCode;

    return new Response(
      JSON.stringify({ isAdmin }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch {
    return new Response(
      JSON.stringify({ isAdmin: false }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
