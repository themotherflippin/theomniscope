import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MORALIS_BASE = "https://deep-index.moralis.io/api/v2.2";
const CHAIN = "0x19"; // Cronos

interface PortfolioRequest {
  address: string;
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
    const body: PortfolioRequest = await req.json();
    const { address, chain = CHAIN } = body;

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return new Response(
        JSON.stringify({ error: "Invalid address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const headers = { "X-API-Key": apiKey, Accept: "application/json" };

    // Fetch native balance, ERC20 tokens, and NFTs in parallel
    const [nativeRes, tokensRes, nftsRes] = await Promise.all([
      fetch(`${MORALIS_BASE}/${address}/balance?chain=${chain}`, { headers }),
      fetch(`${MORALIS_BASE}/${address}/erc20?chain=${chain}`, { headers }),
      fetch(`${MORALIS_BASE}/${address}/nft?chain=${chain}&limit=50&normalizeMetadata=true`, { headers }),
    ]);

    const [nativeData, tokensData, nftsData] = await Promise.all([
      nativeRes.json(),
      tokensRes.json(),
      nftsRes.json(),
    ]);

    // Format native balance (CRO has 18 decimals)
    const nativeBalance = nativeData?.balance
      ? (parseFloat(nativeData.balance) / 1e18).toFixed(4)
      : "0";

    // Format ERC20 tokens
    const tokens = Array.isArray(tokensData)
      ? tokensData.map((t: any) => ({
          address: t.token_address,
          symbol: t.symbol || "???",
          name: t.name || "Unknown Token",
          decimals: t.decimals || 18,
          balance: t.balance || "0",
          balanceFormatted: t.decimals
            ? (parseFloat(t.balance) / Math.pow(10, t.decimals)).toFixed(4)
            : t.balance,
          logo: t.logo || t.thumbnail || null,
          usdPrice: t.usd_price ?? null,
          usdValue: t.usd_price
            ? (parseFloat(t.balance) / Math.pow(10, t.decimals || 18)) * t.usd_price
            : null,
        }))
      : [];

    // Format NFTs
    const nfts = Array.isArray(nftsData?.result)
      ? nftsData.result.map((n: any) => ({
          tokenAddress: n.token_address,
          tokenId: n.token_id,
          name: n.normalized_metadata?.name || n.name || `#${n.token_id}`,
          collectionName: n.name || "Unknown Collection",
          image: n.normalized_metadata?.image || n.token_uri || null,
          tokenType: n.contract_type || "ERC721",
          amount: n.amount || "1",
        }))
      : [];

    // Sort tokens by USD value desc, then by balance
    tokens.sort((a: any, b: any) => (b.usdValue ?? 0) - (a.usdValue ?? 0));

    const totalUsdValue = tokens.reduce(
      (sum: number, t: any) => sum + (t.usdValue ?? 0),
      0
    );

    return new Response(
      JSON.stringify({
        address,
        chain,
        nativeBalance,
        nativeSymbol: "CRO",
        tokens,
        nfts,
        totalTokens: tokens.length,
        totalNfts: nfts.length,
        totalUsdValue,
        fetchedAt: Date.now(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
