import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const address = url.searchParams.get("address");
    
    if (!address) {
      return new Response(JSON.stringify({ error: "Missing address parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch token pairs from DexScreener
    const dsRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`, {
      headers: { "Accept": "application/json" },
    });

    if (!dsRes.ok) {
      // Try as pair address
      const pairRes = await fetch(`https://api.dexscreener.com/latest/dex/pairs/ethereum/${address}`, {
        headers: { "Accept": "application/json" },
      });
      
      if (!pairRes.ok) {
        return new Response(JSON.stringify({ error: "Token not found on DexScreener", pairs: [] }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      const pairData = await pairRes.json();
      return new Response(JSON.stringify(pairData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await dsRes.json();
    
    if (!data.pairs || data.pairs.length === 0) {
      return new Response(JSON.stringify({ error: "No pairs found for this token", pairs: [] }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sort by liquidity (highest first) and return top pairs
    const sorted = data.pairs
      .sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))
      .slice(0, 5);

    return new Response(JSON.stringify({ pairs: sorted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("DexScreener lookup error:", err);
    return new Response(JSON.stringify({ error: "Internal error", pairs: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
