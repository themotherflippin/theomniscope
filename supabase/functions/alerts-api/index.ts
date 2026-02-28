import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json();
    const { action } = body as { action: string };

    switch (action) {
      case "list": {
        const { status, severity, chain, limit = 50, cursor } = body as {
          status?: string;
          severity?: string;
          chain?: string;
          limit?: number;
          cursor?: string;
        };

        let query = db
          .from("alerts")
          .select("*, alert_rules(name, rule_type)")
          .order("created_at", { ascending: false })
          .limit(Math.min(limit, 100));

        if (status) query = query.eq("status", status);
        if (severity) query = query.eq("severity", severity);
        if (chain) query = query.eq("chain", chain);
        if (cursor) query = query.lt("created_at", cursor);

        const { data, error } = await query;
        if (error) throw error;

        const nextCursor = data && data.length > 0 ? data[data.length - 1].created_at : null;
        return jsonResponse({ alerts: data, cursor: nextCursor });
      }

      case "update_status": {
        const { id, status } = body as { id: string; status: string };
        if (!id) return jsonResponse({ error: "Missing id" }, 400);
        if (!["new", "triaged", "closed"].includes(status)) {
          return jsonResponse({ error: "Invalid status" }, 400);
        }

        const { data, error } = await db
          .from("alerts")
          .update({ status })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return jsonResponse({ alert: data });
      }

      case "create_case": {
        const { id } = body as { id: string };
        // V1.4 stub: return a placeholder case ID
        return jsonResponse({
          caseId: `case-${crypto.randomUUID().slice(0, 8)}`,
          alertId: id,
          status: "open",
          message: "Case creation is a V1.4 feature — placeholder returned",
        });
      }

      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
