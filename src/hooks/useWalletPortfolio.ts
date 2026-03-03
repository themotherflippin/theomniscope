import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TokenHolding {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  logo: string | null;
  usdPrice: number | null;
  usdValue: number | null;
}

export interface NFTHolding {
  tokenAddress: string;
  tokenId: string;
  name: string;
  collectionName: string;
  image: string | null;
  tokenType: string;
  amount: string;
}

export interface WalletPortfolioData {
  address: string;
  chain: string;
  nativeBalance: string;
  nativeSymbol: string;
  tokens: TokenHolding[];
  nfts: NFTHolding[];
  totalTokens: number;
  totalNfts: number;
  totalUsdValue: number;
  fetchedAt: number;
}

async function fetchPortfolio(address: string): Promise<WalletPortfolioData> {
  const { data, error } = await supabase.functions.invoke("wallet-portfolio", {
    body: { address },
  });
  if (error) throw new Error(error.message ?? "Failed to fetch portfolio");
  if (data?.error) throw new Error(data.error);
  return data as WalletPortfolioData;
}

export function useWalletPortfolio(address: string, enabled = true) {
  return useQuery<WalletPortfolioData>({
    queryKey: ["wallet-portfolio", address],
    queryFn: () => fetchPortfolio(address),
    enabled: enabled && !!address && /^0x[a-fA-F0-9]{40}$/.test(address),
    staleTime: 60_000,
    retry: 1,
  });
}
