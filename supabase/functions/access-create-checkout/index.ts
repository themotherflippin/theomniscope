import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WEEKLY_PRICE_ID = "price_1T6XGt9BLst0JwTs4R2Hu4g7";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { device_id, wallet_address } = await req.json();

    if (!device_id) {
      return new Response(
        JSON.stringify({ error: "device_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const origin = req.headers.get("origin") || "https://theomniscope.lovable.app";

    // Create checkout session without requiring auth
    const sessionParams: Record<string, unknown> = {
      line_items: [{ price: WEEKLY_PRICE_ID, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/?payment=success&device_id=${device_id}`,
      cancel_url: `${origin}/?payment=canceled`,
      metadata: { device_id, wallet_address: wallet_address || "" },
      subscription_data: {
        metadata: { device_id, wallet_address: wallet_address || "" },
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log(`[CREATE-CHECKOUT] Session created: ${session.id} for device: ${device_id}`);

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[CREATE-CHECKOUT] Error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
