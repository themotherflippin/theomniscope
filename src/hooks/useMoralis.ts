import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MoralisOptions {
  endpoint: string;
  params?: Record<string, string>;
  chain?: string;
  enabled?: boolean;
}

async function callMoralis<T>(endpoint: string, params: Record<string, string> = {}, chain = "0x19"): Promise<T> {
  const { data, error } = await supabase.functions.invoke("moralis-proxy", {
    body: { endpoint, params, chain },
  });

  if (error) throw new Error(error.message ?? "Moralis proxy call failed");
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export function useMoralis<T = unknown>({ endpoint, params, chain, enabled = true }: MoralisOptions) {
  return useQuery<T>({
    queryKey: ["moralis", endpoint, params, chain],
    queryFn: () => callMoralis<T>(endpoint, params, chain),
    enabled,
    staleTime: 30_000,
    retry: 1,
  });
}

// Typed wrappers for common Moralis endpoints

export interface MoralisTokenPrice {
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: string;
  nativePrice: { value: string; decimals: number; name: string; symbol: string };
  usdPrice: number;
  usdPriceFormatted: string;
  "24hrPercentChange": string;
  exchangeName: string;
  exchangeAddress: string;
  tokenAddress: string;
}

export interface MoralisTransaction {
  hash: string;
  from_address: string;
  to_address: string;
  value: string;
  block_timestamp: string;
  block_number: string;
  gas: string;
  gas_price: string;
  receipt_status: string;
}

export interface MoralisErc20Transfer {
  transaction_hash: string;
  from_address: string;
  to_address: string;
  value: string;
  token_name: string;
  token_symbol: string;
  token_decimals: string;
  block_timestamp: string;
  address: string; // contract address
}

export function useWalletTransactions(address: string, chain = "0x19") {
  return useMoralis<{ result: MoralisTransaction[] }>({
    endpoint: `/${address}`,
    chain,
    enabled: !!address,
  });
}

export function useWalletTokenTransfers(address: string, chain = "0x19") {
  return useMoralis<{ result: MoralisErc20Transfer[] }>({
    endpoint: `/erc20/transfers`,
    params: { address },
    chain,
    enabled: !!address,
  });
}

export function useTokenPrice(tokenAddress: string, chain = "0x19") {
  return useMoralis<MoralisTokenPrice>({
    endpoint: `/erc20/${tokenAddress}/price`,
    chain,
    enabled: !!tokenAddress,
  });
}

export { callMoralis };
