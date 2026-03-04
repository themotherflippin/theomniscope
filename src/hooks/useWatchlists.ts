import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// --- Types ---

export interface WatchlistItem {
  id: string;
  user_id: string | null;
  type: "wallet" | "token" | "cluster";
  subject: string;
  chain: string;
  label: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateWatchlistInput {
  type: "wallet" | "token" | "cluster";
  subject: string;
  chain?: string;
  label?: string;
}

// --- Device ID helper ---
function getDeviceId(): string {
  let id = localStorage.getItem("oracle_device_id");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("oracle_device_id", id); }
  return id;
}

// --- API calls ---

async function invokeWatchlist<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("watchlist-api", {
    body: { ...body, device_id: getDeviceId() },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data as T;
}

// --- Hooks ---

export function useWatchlists() {
  return useQuery({
    queryKey: ["watchlists"],
    queryFn: async () => {
      const res = await invokeWatchlist<{ watchlists: WatchlistItem[] }>({
        action: "list",
      });
      return res.watchlists;
    },
    staleTime: 30_000,
  });
}

export function useCreateWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWatchlistInput) =>
      invokeWatchlist<{ watchlist: WatchlistItem }>({
        action: "create",
        ...input,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlists"] }),
  });
}

export function useUpdateWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; label?: string; is_enabled?: boolean }) =>
      invokeWatchlist<{ watchlist: WatchlistItem }>({
        action: "update",
        ...input,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlists"] }),
  });
}

export function useDeleteWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      invokeWatchlist<{ success: boolean }>({ action: "delete", id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlists"] }),
  });
}
