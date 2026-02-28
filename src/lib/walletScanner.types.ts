/** Types for the full Wallet Scanner */

export interface CounterpartyResult {
  address: string;
  isContract: boolean;
  txCount: number;
  volumeIn: number;
  volumeOut: number;
  firstSeen: string | null;
  lastSeen: string | null;
  bidirectional: boolean;
  tokenDiversity: number;
  linkScore: number;
  linkStrength: "strong" | "medium" | "weak";
}

export interface ContractResult {
  address: string;
  txCount: number;
  isRouter: boolean;
  label: string | null;
}

export interface ClusterNode {
  address: string;
  role: "seed" | "core" | "associated" | "peripheral";
  linkScore: number;
  depth: number;
}

export interface ClusterEdgeResult {
  source: string;
  target: string;
  txCount: number;
  totalVolume: number;
  strength: "strong" | "medium" | "weak";
}

export interface WalletScanResult {
  scanId: string;
  address: string;
  chain: string;
  status: string;
  totalTxCount: number;
  totalVolumeIn: number;
  totalVolumeOut: number;
  firstSeen: string | null;
  lastSeen: string | null;
  counterparties: CounterpartyResult[];
  contracts: ContractResult[];
  topSources: CounterpartyResult[];
  topDestinations: CounterpartyResult[];
  cluster: ClusterNode[];
  clusterEdges: ClusterEdgeResult[];
  depth: number;
}

export interface ScanConfig {
  depth: 1 | 2 | 3;
  includeRouters: boolean;
  showAllLinks: boolean;
  scoreThreshold: number;
}
