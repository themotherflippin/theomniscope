import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Receiving wallet — hardcoded server-side for security
const RECEIVING_WALLET = "0xdbda66e5c1ab4d35d96bfb77c252466f864e48da";
const REQUIRED_CRO = 399;
const CRO_DECIMALS = 18;
const CRONOS_RPC = "https://evm.cronos.org";

// Tolerance: accept 398.5+ CRO to handle gas rounding
const MIN_CRO = REQUIRED_CRO - 0.5;

async function verifyTransaction(txHash: string): Promise<{
  valid: boolean;
  from: string;
  to: string;
  valueCro: number;
  error?: string;
}> {
  try {
    // Fetch transaction receipt to ensure it's confirmed
    const receiptRes = await fetch(CRONOS_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getTransactionReceipt",
        params: [txHash],
        id: 1,
      }),
    });
    const receiptData = await receiptRes.json();

    if (!receiptData.result) {
      return { valid: false, from: "", to: "", valueCro: 0, error: "Transaction not found or not yet confirmed" };
    }

    if (receiptData.result.status !== "0x1") {
      return { valid: false, from: "", to: "", valueCro: 0, error: "Transaction failed on-chain" };
    }

    // Fetch actual transaction for value
    const txRes = await fetch(CRONOS_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getTransactionByHash",
        params: [txHash],
        id: 2,
      }),
    });
    const txData = await txRes.json();

    if (!txData.result) {
      return { valid: false, from: "", to: "", valueCro: 0, error: "Transaction data unavailable" };
    }

    const tx = txData.result;
    const from = tx.from.toLowerCase();
    const to = tx.to?.toLowerCase() || "";
    const valueWei = BigInt(tx.value);
    const valueCro = Number(valueWei) / Math.pow(10, CRO_DECIMALS);

    return { valid: true, from, to, valueCro };
  } catch (err) {
    console.error("[CRO-PAYMENT] RPC error:", err);
    return { valid: false, from: "", to: "", valueCro: 0, error: "RPC verification failed" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tx_hash, device_id, wallet_address } = await req.json();

    // Input validation
    if (!tx_hash || !device_id || !wallet_address) {
      return new Response(
        JSON.stringify({ error: "tx_hash, device_id, and wallet_address required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate tx_hash format (66 chars hex)
    if (!/^0x[a-fA-F0-9]{64}$/.test(tx_hash)) {
      return new Response(
        JSON.stringify({ error: "Invalid transaction hash format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedAddress = wallet_address.toLowerCase();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Prevent replay attacks: check if this tx_hash was already used
    const { data: existingEvents } = await supabase
      .from("access_events")
      .select("id")
      .eq("event_type", "cro_payment")
      .contains("metadata", { tx_hash })
      .limit(1);

    if (existingEvents && existingEvents.length > 0) {
      return new Response(
        JSON.stringify({ error: "This transaction has already been used" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify on-chain
    const verification = await verifyTransaction(tx_hash);

    if (!verification.valid) {
      console.error(`[CRO-PAYMENT] Verification failed: ${verification.error}`);
      return new Response(
        JSON.stringify({ error: verification.error || "Transaction verification failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Security checks
    // 1. Recipient must be our wallet
    if (verification.to !== RECEIVING_WALLET) {
      console.error(`[CRO-PAYMENT] Wrong recipient: ${verification.to}`);
      return new Response(
        JSON.stringify({ error: "Transaction not sent to correct address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Sender must match connected wallet
    if (verification.from !== normalizedAddress) {
      console.error(`[CRO-PAYMENT] Sender mismatch: ${verification.from} != ${normalizedAddress}`);
      return new Response(
        JSON.stringify({ error: "Transaction sender does not match connected wallet" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Amount must be >= 398.5 CRO
    if (verification.valueCro < MIN_CRO) {
      console.error(`[CRO-PAYMENT] Insufficient amount: ${verification.valueCro} CRO (need ${REQUIRED_CRO})`);
      return new Response(
        JSON.stringify({ error: `Insufficient amount: ${verification.valueCro.toFixed(2)} CRO sent, ${REQUIRED_CRO} CRO required` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // All checks passed — grant 30-day subscription
    const sessionToken = Array.from(
      crypto.getRandomValues(new Uint8Array(32)),
      (b) => b.toString(16).padStart(2, "0")
    ).join("");
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const subscriptionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: existing } = await supabase
      .from("user_access")
      .select("id")
      .eq("device_id", device_id)
      .limit(1);

    if (existing && existing.length > 0) {
      await supabase
        .from("user_access")
        .update({
          access_type: "subscription",
          wallet_address: normalizedAddress,
          subscription_status: "active",
          subscription_expires_at: subscriptionExpiry,
          session_token: sessionToken,
          session_expires_at: sessionExpiry,
        })
        .eq("id", existing[0].id);
    } else {
      await supabase.from("user_access").insert({
        device_id,
        wallet_address: normalizedAddress,
        access_type: "subscription",
        subscription_status: "active",
        subscription_expires_at: subscriptionExpiry,
        session_token: sessionToken,
        session_expires_at: sessionExpiry,
      });
    }

    // Log the payment event with tx_hash for replay protection
    await supabase.from("access_events").insert({
      device_id,
      event_type: "cro_payment",
      metadata: {
        tx_hash,
        wallet_address: normalizedAddress,
        amount_cro: verification.valueCro,
        subscription_expires_at: subscriptionExpiry,
      },
    });

    console.log(`[CRO-PAYMENT] ✅ Payment verified: ${verification.valueCro} CRO from ${normalizedAddress}, tx: ${tx_hash}`);

    return new Response(
      JSON.stringify({
        success: true,
        session_token: sessionToken,
        has_access: true,
        access_type: "subscription",
        subscription_expires_at: subscriptionExpiry,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[CRO-PAYMENT] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
