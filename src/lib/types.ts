export type Chain = 'ethereum' | 'bsc' | 'arbitrum' | 'polygon' | 'base';
export type DEX = 'uniswap_v2' | 'uniswap_v3' | 'pancakeswap' | 'sushiswap';
export type SignalType = 'ENTRY' | 'EXIT' | 'HOLD' | 'AVOID';
export type SignalStrategy = 'breakout' | 'reversal' | 'trend_follow';
export type Confidence = 'low' | 'medium' | 'high';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Token {
  id: string;
  symbol: string;
  name: string;
  address: string;
  chain: Chain;
  dex: DEX;
  price: number;
  priceChange5m: number;
  priceChange1h: number;
  priceChange24h: number;
  volume5m: number;
  volume1h: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
  txCount24h: number;
  buyCount: number;
  sellCount: number;
  holders: number;
  ageHours: number;
  volatility: number;
  rsi: number;
  ema20: number;
  ema50: number;
  vwap: number;
  atr: number;
  isFavorite?: boolean;
  tags?: string[];
}

export interface RiskReport {
  tokenId: string;
  score: number; // 0-100, higher = riskier
  level: RiskLevel;
  flags: RiskFlag[];
  badge: string | null; // "AVOID" if critical
}

export interface RiskFlag {
  id: string;
  label: string;
  severity: 'info' | 'warning' | 'danger' | 'critical';
  detail: string;
}

export interface Signal {
  id: string;
  tokenId: string;
  tokenSymbol: string;
  type: SignalType;
  strategy: SignalStrategy;
  confidence: Confidence;
  entryZone: string;
  stopLoss: string;
  takeProfit1: string;
  takeProfit2: string;
  invalidation: string;
  reasons: string[];
  riskScore: number;
  timestamp: number;
}

export interface Alert {
  id: string;
  tokenId: string;
  tokenSymbol: string;
  type: 'price' | 'volume' | 'signal' | 'risk';
  message: string;
  timestamp: number;
  read: boolean;
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
