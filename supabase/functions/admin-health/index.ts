import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MORALIS_BASE = "https://deep-index.moralis.io/api/v2.2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const moralisKey = Deno.env.get("MORALIS_API_KEY");
  const cmcKey = Deno.env.get("CMC_API_KEY");
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const db = createClient(supabaseUrl, serviceKey);

  const health: Record<string, unknown> = {};

  // 1. Database health + stats
  const dbStart = performance.now();
  try {
    const [
      alertsRes,
      rulesRes,
      watchlistsRes,
      codesRes,
      usedCodesRes,
      casesRes,
      reportsRes,
      scansRes,
      lastAlertRes,
    ] = await Promise.all([
      db.from("alerts").select("id", { count: "exact", head: true }),
      db.from("alert_rules").select("id", { count: "exact", head: true }).eq("is_enabled", true),
      db.from("watchlists").select("id", { count: "exact", head: true }).eq("is_enabled", true),
      db.from("invitation_codes").select("id", { count: "exact", head: true }),
      db.from("invitation_codes").select("id", { count: "exact", head: true }).eq("is_used", true),
      db.from("cases").select("id", { count: "exact", head: true }),
      db.from("report_jobs").select("id", { count: "exact", head: true }),
      db.from("wallet_scans").select("id", { count: "exact", head: true }),
      db.from("alerts").select("created_at").order("created_at", { ascending: false }).limit(1),
    ]);

    const dbLatency = Math.round(performance.now() - dbStart);

    health.database = {
      status: "healthy",
      latencyMs: dbLatency,
      stats: {
        alerts: alertsRes.count ?? 0,
        activeRules: rulesRes.count ?? 0,
        activeWatchlists: watchlistsRes.count ?? 0,
        totalCodes: codesRes.count ?? 0,
        usedCodes: usedCodesRes.count ?? 0,
        cases: casesRes.count ?? 0,
        reports: reportsRes.count ?? 0,
        walletScans: scansRes.count ?? 0,
        lastAlert: lastAlertRes.data?.[0]?.created_at ?? null,
      },
    };
  } catch (err) {
    health.database = {
      status: "error",
      latencyMs: Math.round(performance.now() - dbStart),
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // 2. Moralis API health
  const moralisStart = performance.now();
  try {
    if (!moralisKey) {
      health.moralis = { status: "not_configured" };
    } else {
      const res = await fetch(`${MORALIS_BASE}/block/1?chain=0x19`, {
        headers: { "X-API-Key": moralisKey, Accept: "application/json" },
      });
      const moralisLatency = Math.round(performance.now() - moralisStart);
      health.moralis = {
        status: res.ok ? "healthy" : "error",
        latencyMs: moralisLatency,
        httpStatus: res.status,
      };
      await res.text(); // consume body
    }
  } catch (err) {
    health.moralis = {
      status: "error",
      latencyMs: Math.round(performance.now() - moralisStart),
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // 3. CMC API health
  try {
    if (!cmcKey) {
      health.cmc = { status: "not_configured" };
    } else {
      const cmcStart = performance.now();
      const res = await fetch(
        "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=1",
        { headers: { "X-CMC_PRO_API_KEY": cmcKey, Accept: "application/json" } }
      );
      health.cmc = {
        status: res.ok ? "healthy" : "error",
        latencyMs: Math.round(performance.now() - cmcStart),
        httpStatus: res.status,
      };
      await res.text();
    }
  } catch (err) {
    health.cmc = {
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // 4. Stripe health
  try {
    if (!stripeKey) {
      health.stripe = { status: "not_configured" };
    } else {
      const stripeStart = performance.now();
      const res = await fetch("https://api.stripe.com/v1/balance", {
        headers: { Authorization: `Bearer ${stripeKey}` },
      });
      health.stripe = {
        status: res.ok ? "healthy" : "error",
        latencyMs: Math.round(performance.now() - stripeStart),
        httpStatus: res.status,
      };
      await res.text();
    }
  } catch (err) {
    health.stripe = {
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // 5. Edge Functions check (secrets presence as proxy)
  health.edgeFunctions = {
    status: "healthy",
    configured: {
      moralis: !!moralisKey,
      cmc: !!cmcKey,
      stripe: !!stripeKey,
      supabase: !!supabaseUrl && !!serviceKey,
    },
  };

  // 6. Storage check
  try {
    const { data: buckets, error } = await db.storage.listBuckets();
    health.storage = {
      status: error ? "error" : "healthy",
      buckets: buckets?.map((b) => b.name) ?? [],
    };
  } catch {
    health.storage = { status: "error" };
  }

  return new Response(JSON.stringify(health), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
