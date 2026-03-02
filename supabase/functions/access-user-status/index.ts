import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_token, device_id } = await req.json();

    if (!session_token && !device_id) {
      return new Response(
        JSON.stringify({ has_access: false, reason: "no_session" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    let query = supabase.from("user_access").select("*");

    if (session_token) {
      query = query.eq("session_token", session_token);
    } else {
      query = query.eq("device_id", device_id);
    }

    const { data, error } = await query.limit(1);

    if (error || !data || data.length === 0) {
      return new Response(
        JSON.stringify({ has_access: false, reason: "not_found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = data[0];

    // Check session expiry
    if (user.session_expires_at && new Date(user.session_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ has_access: false, reason: "session_expired" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check subscription expiry
    if (user.access_type === "subscription" && user.subscription_expires_at) {
      if (new Date(user.subscription_expires_at) < new Date()) {
        await supabase
          .from("user_access")
          .update({ access_type: "none", subscription_status: "expired" })
          .eq("id", user.id);

        return new Response(
          JSON.stringify({ has_access: false, reason: "subscription_expired" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const hasAccess =
      user.access_type === "nft" ||
      user.access_type === "subscription" ||
      user.access_type === "credits" ||
      user.access_type === "invitation";

    return new Response(
      JSON.stringify({
        has_access: hasAccess,
        access_type: user.access_type,
        credits: user.credits,
        nft_verified: user.nft_verified,
        wallet_address: user.wallet_address,
        subscription_status: user.subscription_status,
        subscription_expires_at: user.subscription_expires_at,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[USER-STATUS] Error:", err);
    return new Response(
      JSON.stringify({ has_access: false, reason: "error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
