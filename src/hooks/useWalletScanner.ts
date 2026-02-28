import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { WalletScanResult, ScanConfig } from "@/lib/walletScanner.types";

async function runWalletScan(
  address: string,
  config: ScanConfig
): Promise<WalletScanResult> {
  const { data, error } = await supabase.functions.invoke("wallet-scanner", {
    body: {
      address,
      chain: "cronos",
      depth: config.depth,
      includeRouters: config.includeRouters,
      scoreThreshold: config.showAllLinks ? 0 : config.scoreThreshold,
    },
  });

  if (error) throw new Error(error.message ?? "Wallet scan failed");
  if (data?.error) throw new Error(data.error);
  return data as WalletScanResult;
}

export function useWalletScanner(
  address: string,
  config: ScanConfig,
  enabled = true
) {
  return useQuery<WalletScanResult>({
    queryKey: ["wallet-scanner", address, config.depth, config.includeRouters, config.showAllLinks, config.scoreThreshold],
    queryFn: () => runWalletScan(address, config),
    enabled: enabled && !!address && /^0x[a-fA-F0-9]{40}$/.test(address),
    staleTime: 5 * 60_000,
    retry: 1,
    gcTime: 10 * 60_000,
  });
}
