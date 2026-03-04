import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef, useCallback } from "react";

// --- Types ---

export interface ServerAlert {
  id: string;
  user_id: string | null;
  chain: string;
  scope: string;
  subject: string | null;
  rule_id: string | null;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  evidence: Record<string, unknown>;
  status: "new" | "triaged" | "closed";
  created_at: string;
  alert_rules?: { name: string; rule_type: string } | null;
}

export interface AlertsListParams {
  status?: string;
  severity?: string;
  chain?: string;
  limit?: number;
}

// --- Device ID helper ---
function getDeviceId(): string {
  let id = localStorage.getItem("oracle_device_id");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("oracle_device_id", id); }
  return id;
}

// --- API calls ---

async function invokeAlerts<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("alerts-api", { body: { ...body, device_id: getDeviceId() } });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data as T;
}

// --- Hooks ---

export function useServerAlerts(params: AlertsListParams = {}) {
  return useQuery({
    queryKey: ["server-alerts", params],
    queryFn: async () => {
      const res = await invokeAlerts<{ alerts: ServerAlert[]; cursor: string | null }>({
        action: "list",
        ...params,
      });
      return res;
    },
    staleTime: 15_000,
    refetchInterval: 30_000, // Poll every 30s for "realtime feel"
  });
}

export function useUpdateAlertStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; status: "new" | "triaged" | "closed" }) =>
      invokeAlerts<{ alert: ServerAlert }>({
        action: "update_status",
        ...input,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["server-alerts"] }),
  });
}

export function useRunAlertScanner() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("alert-scanner", {
        body: {},
      });
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

/**
 * useAlertsFeed: pluggable transport hook.
 * Currently uses polling; designed for easy switch to WebSocket in V2.
 */
export function useAlertsFeed(params: AlertsListParams = {}) {
  const query = useServerAlerts(params);
  const qc = useQueryClient();

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["server-alerts"] });
  }, [qc]);

  return {
    alerts: query.data?.alerts ?? [],
    cursor: query.data?.cursor ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refresh,
    // Future: transport type for WebSocket upgrade
    transport: "polling" as const,
  };
}
