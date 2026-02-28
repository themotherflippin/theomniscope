import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// --- Types ---

export interface AlertRule {
  id: string;
  user_id: string | null;
  name: string;
  scope: "wallet" | "token" | "global";
  chain: string;
  subject: string | null;
  rule_type: "large_transfer" | "lp_remove" | "fresh_wallet" | "concentration_spike" | "loop_suspicion";
  config: Record<string, unknown>;
  severity: "low" | "medium" | "high" | "critical";
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAlertRuleInput {
  name: string;
  scope: "wallet" | "token" | "global";
  chain?: string;
  subject?: string;
  rule_type: AlertRule["rule_type"];
  config?: Record<string, unknown>;
  severity?: AlertRule["severity"];
}

// --- API calls ---

async function invokeRules<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("alert-rules-api", { body });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data as T;
}

// --- Hooks ---

export function useAlertRules() {
  return useQuery({
    queryKey: ["alert-rules"],
    queryFn: async () => {
      const res = await invokeRules<{ rules: AlertRule[] }>({ action: "list" });
      return res.rules;
    },
    staleTime: 60_000,
  });
}

export function useCreateAlertRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAlertRuleInput) =>
      invokeRules<{ rule: AlertRule }>({ action: "create", ...input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alert-rules"] }),
  });
}

export function useUpdateAlertRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; name?: string; is_enabled?: boolean; severity?: string; config?: Record<string, unknown> }) =>
      invokeRules<{ rule: AlertRule }>({ action: "update", ...input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alert-rules"] }),
  });
}

export function useDeleteAlertRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      invokeRules<{ success: boolean }>({ action: "delete", id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alert-rules"] }),
  });
}
