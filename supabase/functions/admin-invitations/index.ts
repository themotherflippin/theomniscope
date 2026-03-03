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

/** Verify admin status server-side */
async function isAdmin(supabase: ReturnType<typeof createClient>, deviceId: string): Promise<boolean> {
  const adminCode = Deno.env.get("ADMIN_INVITE_CODE");
  if (!adminCode) return false;

  const { data } = await supabase
    .from("invitation_codes")
    .select("code")
    .eq("device_id", deviceId)
    .eq("is_used", true)
    .limit(1);

  return data?.[0]?.code === adminCode;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

const DURATION_DAYS: Record<string, number | null> = {
  "1_week": 7,
  "1_month": 30,
  "3_months": 90,
  "1_year": 365,
  "lifetime": null,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, device_id } = body;

    if (!device_id || typeof device_id !== "string") {
      return jsonResponse({ error: "device_id required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Verify admin status
    const admin = await isAdmin(supabase, device_id);
    if (!admin) {
      return jsonResponse({ error: "Unauthorized" }, 403);
    }

    switch (action) {
      case "list": {
        const { data, error } = await supabase
          .from("invitation_codes")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return jsonResponse({ codes: data });
      }

      case "create": {
        const { duration = "lifetime" } = body;
        if (!DURATION_DAYS.hasOwnProperty(duration)) {
          return jsonResponse({ error: "Invalid duration" }, 400);
        }

        const days = DURATION_DAYS[duration];
        const expiresAt = days
          ? new Date(Date.now() + days * 86400000).toISOString()
          : null;

        const { data, error } = await supabase
          .from("invitation_codes")
          .insert({
            code: generateCode(),
            duration,
            expires_at: expiresAt,
          })
          .select()
          .single();

        if (error) throw error;
        return jsonResponse({ code: data }, 201);
      }

      case "delete": {
        const { code_id } = body;
        if (!code_id) return jsonResponse({ error: "code_id required" }, 400);

        const { error } = await supabase
          .from("invitation_codes")
          .delete()
          .eq("id", code_id);
        if (error) throw error;
        return jsonResponse({ success: true });
      }

      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    console.error("[ADMIN-INVITATIONS] Error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return jsonResponse({ error: message }, 500);
  }
});
