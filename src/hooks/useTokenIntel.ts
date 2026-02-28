import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  TokenSummary,
  TokenHoldersResponse,
  BubblemapResponse,
  TokenRiskFlag,
  ConcentrationMetrics,
  BubblemapSignals,
} from "@/lib/tokenIntel.types";

// ---------- Fetchers ----------

async function invokeTokenIntel<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("token-intel", {
    body,
  });
  if (error) throw new Error(error.message ?? "Token intel request failed");
  if (data?.error) throw new Error(data.error);
  return data as T;
}

// ---------- Hooks ----------

export function useTokenSummary(tokenAddress: string, chain = "cronos") {
  return useQuery<TokenSummary>({
    queryKey: ["token-summary", tokenAddress, chain],
    queryFn: () =>
      invokeTokenIntel<TokenSummary>({
        action: "summary",
        tokenAddress,
        chain,
      }),
    enabled: !!tokenAddress && /^0x[a-fA-F0-9]{40}$/.test(tokenAddress),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useTokenHolders(
  tokenAddress: string,
  chain = "cronos",
  limit = 50,
  cursor?: string
) {
  return useQuery<TokenHoldersResponse>({
    queryKey: ["token-holders", tokenAddress, chain, limit, cursor],
    queryFn: () =>
      invokeTokenIntel<TokenHoldersResponse>({
        action: "holders",
        tokenAddress,
        chain,
        limit,
        cursor,
      }),
    enabled: !!tokenAddress && /^0x[a-fA-F0-9]{40}$/.test(tokenAddress),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useTokenBubblemap(
  tokenAddress: string,
  chain = "cronos",
  top = 30,
  windowDays = 7
) {
  return useQuery<BubblemapResponse>({
    queryKey: ["token-bubblemap", tokenAddress, chain, top, windowDays],
    queryFn: () =>
      invokeTokenIntel<BubblemapResponse>({
        action: "bubblemap",
        tokenAddress,
        chain,
        top,
        windowDays,
      }),
    enabled: !!tokenAddress && /^0x[a-fA-F0-9]{40}$/.test(tokenAddress),
    staleTime: 120_000,
    retry: 1,
  });
}

// ---------- Risk signal computation ----------

const CENTRALIZATION_THRESHOLD = 60;
const DOMINANT_HOLDER_THRESHOLD = 20;

export function computeTokenRiskFlags(
  metrics: ConcentrationMetrics | undefined,
  signals: BubblemapSignals | undefined,
  estimated: boolean
): TokenRiskFlag[] {
  const flags: TokenRiskFlag[] = [];

  if (!metrics) return flags;

  if (metrics.top10Pct > CENTRALIZATION_THRESHOLD) {
    flags.push({
      id: "centralization",
      label: "High Centralization",
      severity: metrics.top10Pct > 80 ? "critical" : "danger",
      detail: `Top 10 holders control ${metrics.top10Pct.toFixed(1)}% of supply`,
    });
  }

  // Check for dominant single holder
  if (metrics.top10Pct > 0 && metrics.top25Pct > 0) {
    const topHolderEstimate = metrics.top10Pct / Math.min(10, metrics.top10Pct > 0 ? 10 : 1);
    if (topHolderEstimate > DOMINANT_HOLDER_THRESHOLD) {
      flags.push({
        id: "dominant_holder",
        label: "Dominant Holder",
        severity: "warning",
        detail: `Estimated single holder dominance above ${DOMINANT_HOLDER_THRESHOLD}%`,
      });
    }
  }

  if (signals) {
    if (signals.lpNodes.length > 0 && signals.lpNodes.length >= (signals.contracts.length || 1)) {
      flags.push({
        id: "lp_concentration",
        label: "LP Concentration",
        severity: "info",
        detail: `${signals.lpNodes.length} LP-related node(s) among top holders`,
      });
    }

    if (signals.loopsDetected) {
      flags.push({
        id: "loop_suspicion",
        label: "Transfer Loop Detected",
        severity: "warning",
        detail: "Circular transfer pattern found among top holders",
      });
    }
  }

  if (estimated) {
    flags.push({
      id: "estimated_data",
      label: "Estimated Data",
      severity: "info",
      detail: "Holder data is approximated from recent transfers",
    });
  }

  return flags;
}
