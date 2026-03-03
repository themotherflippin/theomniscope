import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Check NFT balance via JSON-RPC
async function checkNftOwnership(walletAddress: string, nftContract: string, rpcUrl: string): Promise<boolean> {
  try {
    const paddedAddress = walletAddress.toLowerCase().replace("0x", "").padStart(64, "0");
    const data = `0x70a08231${paddedAddress}`;

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_call",
        params: [{ to: nftContract, data }, "latest"],
        id: 1,
      }),
    });

    const result = await response.json();
    if (result.error) {
      console.error("[WALLET-AUTH] RPC error:", result.error);
      return false;
    }

    const balance = parseInt(result.result, 16);
    return balance > 0;
  } catch (err) {
    console.error("[WALLET-AUTH] NFT check failed:", err);
    return false;
  }
}

function getRpcUrl(chainId: number): string {
  const rpcs: Record<number, string> = {
    1: "https://eth.llamarpc.com",
    25: "https://evm.cronos.org",
    56: "https://bsc-dataseed.binance.org",
    137: "https://polygon-rpc.com",
    42161: "https://arb1.arbitrum.io/rpc",
    8453: "https://mainnet.base.org",
  };
  return rpcs[chainId] || rpcs[25];
}

function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { wallet_address, device_id, chain_id } = body;

    // No signature required — just wallet_address and device_id
    if (!wallet_address || !device_id) {
      return new Response(
        JSON.stringify({ error: "wallet_address and device_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedAddress = wallet_address.toLowerCase();

    // Check NFT ownership server-side
    const nftContract = Deno.env.get("NFT_CONTRACT_ADDRESS");
    const rpcUrl = getRpcUrl(chain_id || 25);
    let hasNft = false;

    if (nftContract && nftContract.length > 10) {
      hasNft = await checkNftOwnership(normalizedAddress, nftContract, rpcUrl);
      console.log(`[WALLET-AUTH] NFT check for ${normalizedAddress}: ${hasNft}`);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const sessionToken = generateSessionToken();
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: existing } = await supabase
      .from("user_access")
      .select("*")
      .eq("device_id", device_id)
      .limit(1);

    let userAccess;

    if (existing && existing.length > 0) {
      const updateData: Record<string, unknown> = {
        wallet_address: normalizedAddress,
        session_token: sessionToken,
        session_expires_at: sessionExpiry,
        nft_verified: hasNft,
      };
      if (hasNft) {
        updateData.access_type = "nft";
      }

      const { data, error } = await supabase
        .from("user_access")
        .update(updateData)
        .eq("id", existing[0].id)
        .select()
        .single();

      if (error) throw error;
      userAccess = data;
    } else {
      const { data, error } = await supabase
        .from("user_access")
        .insert({
          device_id,
          wallet_address: normalizedAddress,
          access_type: hasNft ? "nft" : "none",
          nft_verified: hasNft,
          session_token: sessionToken,
          session_expires_at: sessionExpiry,
        })
        .select()
        .single();

      if (error) throw error;
      userAccess = data;
    }

    await supabase.from("access_events").insert({
      device_id,
      event_type: hasNft ? "nft_unlock" : "wallet_connect",
      metadata: { wallet_address: normalizedAddress, chain_id, nft_verified: hasNft },
    });

    const hasAccess =
      userAccess.access_type === "nft" ||
      userAccess.access_type === "subscription" ||
      userAccess.access_type === "credits" ||
      userAccess.access_type === "invitation";

    return new Response(
      JSON.stringify({
        session_token: sessionToken,
        has_access: hasAccess,
        access_type: userAccess.access_type,
        nft_verified: hasNft,
        credits: userAccess.credits,
        wallet_address: normalizedAddress,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[WALLET-AUTH] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
