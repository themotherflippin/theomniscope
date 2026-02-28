import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MORALIS_BASE = "https://deep-index.moralis.io/api/v2.2";

interface MoralisRequest {
  endpoint: string; // e.g. "/erc20/metadata", "/block/1/nft"
  params?: Record<string, string>;
  chain?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("MORALIS_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "MORALIS_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body: MoralisRequest = await req.json();
    const { endpoint, params = {}, chain = "0x19" } = body; // 0x19 = Cronos

    if (!endpoint || typeof endpoint !== "string" || !endpoint.startsWith("/")) {
      return new Response(
        JSON.stringify({ error: "Invalid endpoint. Must start with /" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Allowlist of safe endpoints
    const allowedPrefixes = [
      "/erc20",
      "/token",
      "/block",
      "/transaction",
      "/wallets",
      "/pairs",
      "/market-data",
    ];
    const isAllowed = allowedPrefixes.some((p) => endpoint.startsWith(p));
    if (!isAllowed) {
      return new Response(
        JSON.stringify({ error: "Endpoint not allowed" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(`${MORALIS_BASE}${endpoint}`);
    url.searchParams.set("chain", chain);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }

    const moralisRes = await fetch(url.toString(), {
      headers: {
        "X-API-Key": apiKey,
        "Accept": "application/json",
      },
    });

    const data = await moralisRes.json();

    if (!moralisRes.ok) {
      return new Response(
        JSON.stringify({ error: "Moralis API error", status: moralisRes.status, detail: data }),
        { status: moralisRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
