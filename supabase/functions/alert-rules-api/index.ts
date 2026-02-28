import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_SCOPES = ["wallet", "token", "global"] as const;
const VALID_RULE_TYPES = ["large_transfer", "lp_remove", "fresh_wallet", "concentration_spike", "loop_suspicion"] as const;
const VALID_SEVERITIES = ["low", "medium", "high", "critical"] as const;

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
        const { data, error } = await db
          .from("alert_rules")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return jsonResponse({ rules: data });
      }

      case "create": {
        const { name, scope, chain = "cronos", subject, rule_type, config = {}, severity = "medium" } = body as {
          name: string;
          scope: string;
          chain?: string;
          subject?: string;
          rule_type: string;
          config?: Record<string, unknown>;
          severity?: string;
        };

        if (!name?.trim()) return jsonResponse({ error: "Name is required" }, 400);
        if (!VALID_SCOPES.includes(scope as typeof VALID_SCOPES[number])) {
          return jsonResponse({ error: `Invalid scope` }, 400);
        }
        if (!VALID_RULE_TYPES.includes(rule_type as typeof VALID_RULE_TYPES[number])) {
          return jsonResponse({ error: `Invalid rule_type` }, 400);
        }
        if (!VALID_SEVERITIES.includes(severity as typeof VALID_SEVERITIES[number])) {
          return jsonResponse({ error: `Invalid severity` }, 400);
        }

        const { data, error } = await db
          .from("alert_rules")
          .insert({ name: name.trim(), scope, chain, subject: subject?.toLowerCase() ?? null, rule_type, config, severity })
          .select()
          .single();
        if (error) throw error;
        return jsonResponse({ rule: data }, 201);
      }

      case "update": {
        const { id, ...updates } = body as { id: string; [key: string]: unknown };
        if (!id) return jsonResponse({ error: "Missing id" }, 400);

        const allowed: Record<string, unknown> = {};
        if (typeof updates.name === "string") allowed.name = updates.name;
        if (typeof updates.is_enabled === "boolean") allowed.is_enabled = updates.is_enabled;
        if (typeof updates.severity === "string") allowed.severity = updates.severity;
        if (typeof updates.config === "object") allowed.config = updates.config;

        const { data, error } = await db
          .from("alert_rules")
          .update(allowed)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return jsonResponse({ rule: data });
      }

      case "delete": {
        const { id } = body as { id: string };
        if (!id) return jsonResponse({ error: "Missing id" }, 400);
        const { error } = await db.from("alert_rules").delete().eq("id", id);
        if (error) throw error;
        return jsonResponse({ success: true });
      }

      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
