/** Shared types for Token Intel module */

export interface TokenSummary {
  tokenAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string | null;
  logo: string | null;
  chain: string;
  price: number | null;
  priceChange24h: number | null;
}

export interface TokenHolder {
  address: string;
  balance: string;
  balanceFormatted: string;
  pctOfSupply: number;
}

export interface ConcentrationMetrics {
  top10Pct: number;
  top25Pct: number;
  top50Pct: number;
  giniApprox: number;
  holderCount: number | null;
}

export interface TokenHoldersResponse {
  tokenAddress: string;
  chain: string;
  holders: TokenHolder[];
  metrics: ConcentrationMetrics;
  cursor: string | null;
  estimated: boolean;
}

export interface BubblemapNode {
  id: string;
  label: string;
  size: number;
  pctOfSupply: number;
  tags: string[];
}

export interface BubblemapEdge {
  source: string;
  target: string;
  weight: number;
  txCount: number;
  netFlow: number;
}

export interface BubblemapSignals {
  loopsDetected: boolean;
  lpNodes: string[];
  contracts: string[];
  freshWallets: string[];
}

export interface BubblemapResponse {
  tokenAddress: string;
  chain: string;
  nodes: BubblemapNode[];
  edges: BubblemapEdge[];
  signals: BubblemapSignals;
}

export type TokenRiskFlagId =
  | "centralization"
  | "dominant_holder"
  | "lp_concentration"
  | "loop_suspicion"
  | "estimated_data";

export interface TokenRiskFlag {
  id: TokenRiskFlagId;
  label: string;
  severity: "info" | "warning" | "danger" | "critical";
  detail: string;
}
