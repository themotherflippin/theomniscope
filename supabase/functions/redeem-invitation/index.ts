import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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
    const { action, code, device_id } = await req.json();

    if (!device_id || typeof device_id !== "string" || device_id.length > 128) {
      return jsonResponse({ error: "Invalid device_id" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Action: check — verify if this device already has a redeemed code
    if (action === "check") {
      const { data } = await supabase
        .from("invitation_codes")
        .select("id")
        .eq("device_id", device_id)
        .eq("is_used", true)
        .limit(1);

      return jsonResponse({ has_access: !!(data && data.length > 0) });
    }

    // Action: redeem — validate and redeem an invitation code
    if (action === "redeem") {
      if (!code || typeof code !== "string") {
        return jsonResponse({ error: "Code required" }, 400);
      }

      const trimmed = code.trim().toUpperCase();
      if (trimmed.length < 4 || trimmed.length > 20) {
        return jsonResponse({ error: "Invalid code format" }, 400);
      }

      // Look up the code
      const { data: codeData } = await supabase
        .from("invitation_codes")
        .select("*")
        .eq("code", trimmed)
        .limit(1);

      if (!codeData || codeData.length === 0) {
        return jsonResponse({ error: "Invalid code" }, 404);
      }

      const invitation = codeData[0];

      // Check if already used by this device
      if (invitation.is_used && invitation.device_id === device_id) {
        // Already redeemed by this device — grant access
        return jsonResponse({ success: true, already_redeemed: true });
      }

      // Check if used by someone else
      if (invitation.is_used) {
        return jsonResponse({ error: "Code already used" }, 409);
      }

      // Check expiry
      if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
        return jsonResponse({ error: "Code expired" }, 410);
      }

      // Mark code as used
      const { error: updateErr } = await supabase
        .from("invitation_codes")
        .update({
          is_used: true,
          device_id: device_id,
          used_at: new Date().toISOString(),
        })
        .eq("id", invitation.id);

      if (updateErr) {
        console.error("[REDEEM] Update error:", updateErr);
        return jsonResponse({ error: "Failed to redeem code" }, 500);
      }

      // Create or update user_access
      const sessionToken = generateSessionToken();
      const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: existing } = await supabase
        .from("user_access")
        .select("id")
        .eq("device_id", device_id)
        .limit(1);

      if (existing && existing.length > 0) {
        await supabase
          .from("user_access")
          .update({
            access_type: "invitation",
            session_token: sessionToken,
            session_expires_at: expiry,
          })
          .eq("id", existing[0].id);
      } else {
        await supabase.from("user_access").insert({
          device_id,
          access_type: "invitation",
          session_token: sessionToken,
          session_expires_at: expiry,
        });
      }

      // Log event
      await supabase.from("access_events").insert({
        device_id,
        event_type: "invitation_code",
        metadata: { code: trimmed },
      });

      return jsonResponse({
        success: true,
        session_token: sessionToken,
      });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error("[REDEEM-INVITATION] Error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
