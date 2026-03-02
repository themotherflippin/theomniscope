import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!stripeKey || !webhookSecret) {
    console.error("[STRIPE-WEBHOOK] Missing configuration");
    return new Response("Server misconfigured", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  let event: Stripe.Event;
  const body = await req.text();

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error("[STRIPE-WEBHOOK] Signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  console.log(`[STRIPE-WEBHOOK] Event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const deviceId = session.metadata?.device_id;
        if (!deviceId) break;

        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        // Get subscription details for expiry
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const expiresAt = new Date(subscription.current_period_end * 1000).toISOString();

        // Generate new session token
        const bytes = new Uint8Array(32);
        crypto.getRandomValues(bytes);
        const sessionToken = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

        // Upsert user access
        const { data: existing } = await supabase
          .from("user_access")
          .select("id")
          .eq("device_id", deviceId)
          .limit(1);

        if (existing && existing.length > 0) {
          await supabase
            .from("user_access")
            .update({
              access_type: "subscription",
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_status: "active",
              subscription_expires_at: expiresAt,
              session_token: sessionToken,
              session_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .eq("id", existing[0].id);
        } else {
          await supabase.from("user_access").insert({
            device_id: deviceId,
            access_type: "subscription",
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: "active",
            subscription_expires_at: expiresAt,
            session_token: sessionToken,
            session_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          });
        }

        // Log event
        await supabase.from("access_events").insert({
          device_id: deviceId,
          event_type: "payment_success",
          metadata: { subscription_id: subscriptionId, customer_id: customerId },
        });

        console.log(`[STRIPE-WEBHOOK] Subscription activated for device: ${deviceId}`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const expiresAt = new Date(subscription.current_period_end * 1000).toISOString();
        const deviceId = subscription.metadata?.device_id;

        if (deviceId) {
          await supabase
            .from("user_access")
            .update({
              subscription_status: "active",
              subscription_expires_at: expiresAt,
            })
            .eq("device_id", deviceId);
        }
        break;
      }

      case "customer.subscription.deleted":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const deviceId = subscription.metadata?.device_id;

        if (!deviceId) break;

        const isActive = subscription.status === "active";

        await supabase
          .from("user_access")
          .update({
            subscription_status: subscription.status,
            access_type: isActive ? "subscription" : "none",
          })
          .eq("device_id", deviceId);

        break;
      }
    }
  } catch (err) {
    console.error("[STRIPE-WEBHOOK] Processing error:", err);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
