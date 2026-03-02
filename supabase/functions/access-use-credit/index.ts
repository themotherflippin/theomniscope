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
    const { session_token, device_id, amount = 1 } = await req.json();

    if (!session_token && !device_id) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof amount !== "number" || amount < 1 || amount > 100) {
      return new Response(
        JSON.stringify({ error: "Invalid amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Find user
    let query = supabase.from("user_access").select("*");
    if (session_token) {
      query = query.eq("session_token", session_token);
    } else {
      query = query.eq("device_id", device_id);
    }

    const { data, error } = await query.limit(1);
    if (error || !data || data.length === 0) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = data[0];

    if (user.credits < amount) {
      return new Response(
        JSON.stringify({ error: "Insufficient credits", credits: user.credits }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newBalance = user.credits - amount;

    // Update credits
    const { error: updateError } = await supabase
      .from("user_access")
      .update({
        credits: newBalance,
        access_type: newBalance > 0 ? "credits" : user.nft_verified ? "nft" : "none",
      })
      .eq("id", user.id);

    if (updateError) throw updateError;

    // Log credit usage
    await supabase.from("credit_logs").insert({
      user_access_id: user.id,
      action: "use",
      amount: -amount,
      balance_after: newBalance,
      metadata: { timestamp: new Date().toISOString() },
    });

    // Log analytics
    await supabase.from("access_events").insert({
      device_id: user.device_id,
      event_type: "credit_use",
      metadata: { amount, balance_after: newBalance },
    });

    return new Response(
      JSON.stringify({ success: true, credits: newBalance }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[USE-CREDIT] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
