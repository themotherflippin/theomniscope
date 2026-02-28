import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_TYPES = ["wallet", "token", "cluster"] as const;
const VALID_CHAINS = ["cronos", "ethereum", "bsc", "polygon", "arbitrum", "base"] as const;

function isValidEvmAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const db = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();
    const { action } = body as { action: string };

    switch (action) {
      case "list": {
        const { data, error } = await db
          .from("watchlists")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return jsonResponse({ watchlists: data });
      }

      case "create": {
        const { type, subject, chain = "cronos", label = "" } = body as {
          type: string;
          subject: string;
          chain?: string;
          label?: string;
        };

        if (!VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
          return jsonResponse({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` }, 400);
        }
        if (!subject || !isValidEvmAddress(subject)) {
          return jsonResponse({ error: "Invalid EVM address format" }, 400);
        }
        if (!VALID_CHAINS.includes(chain as typeof VALID_CHAINS[number])) {
          return jsonResponse({ error: `Invalid chain. Must be one of: ${VALID_CHAINS.join(", ")}` }, 400);
        }

        const { data, error } = await db
          .from("watchlists")
          .insert({ type, subject: subject.toLowerCase(), chain, label })
          .select()
          .single();
        if (error) {
          if (error.code === "23505") {
            return jsonResponse({ error: "This address is already in your watchlist" }, 409);
          }
          throw error;
        }
        return jsonResponse({ watchlist: data }, 201);
      }

      case "update": {
        const { id, label, is_enabled } = body as {
          id: string;
          label?: string;
          is_enabled?: boolean;
        };
        if (!id) return jsonResponse({ error: "Missing id" }, 400);

        const updates: Record<string, unknown> = {};
        if (label !== undefined) updates.label = label;
        if (is_enabled !== undefined) updates.is_enabled = is_enabled;

        const { data, error } = await db
          .from("watchlists")
          .update(updates)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return jsonResponse({ watchlist: data });
      }

      case "delete": {
        const { id } = body as { id: string };
        if (!id) return jsonResponse({ error: "Missing id" }, 400);

        const { error } = await db.from("watchlists").delete().eq("id", id);
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
