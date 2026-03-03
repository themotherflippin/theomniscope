/**
 * Centralized Zod validation schemas for all API payloads.
 * Every external data source MUST be validated through these schemas
 * before being used in the application.
 */
import { z } from 'zod';

// ─── Primitives ───────────────────────────────────────────────

/** Non-negative number, defaults to 0 if null/undefined */
const safeNum = z.coerce.number().default(0);
const safePositiveNum = z.coerce.number().nonnegative().default(0);
const safePct = z.coerce.number().default(0); // percentage, can be negative
const optionalNum = z.coerce.number().nullable().optional().default(null);
const optionalStr = z.string().nullable().optional().default(null);
const isoTimestamp = z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/));

// ─── CoinMarketCap ───────────────────────────────────────────

export const CMCTokenSchema = z.object({
  cmcId: z.coerce.number().int().positive(),
  symbol: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  price: z.coerce.number().nonnegative(),
  priceChange1h: safePct,
  priceChange24h: safePct,
  priceChange7d: safePct,
  volume24h: safePositiveNum,
  marketCap: safePositiveNum,
  lastUpdated: z.string().min(1),
});
export type ValidatedCMCToken = z.infer<typeof CMCTokenSchema>;

// ─── DexScreener ──────────────────────────────────────────────

export const DexTokenSchema = z.object({
  pairAddress: z.string().min(1),
  dexId: z.string().min(1),
  chainId: z.string().min(1),
  priceUsd: optionalNum,
  priceChange5m: optionalNum,
  priceChange1h: optionalNum,
  priceChange6h: optionalNum,
  priceChange24h: optionalNum,
  volume5m: optionalNum,
  volume1h: optionalNum,
  volume6h: optionalNum,
  volume24h: optionalNum,
  liquidity: optionalNum,
  marketCap: optionalNum,
  pairCreatedAt: optionalNum,
  txns24h: safeNum,
  buys24h: safeNum,
  sells24h: safeNum,
  txns1h: safeNum,
  buys1h: safeNum,
  sells1h: safeNum,
  txns5m: safeNum,
  buys5m: safeNum,
  sells5m: safeNum,
  baseTokenAddress: optionalStr,
  baseTokenName: optionalStr,
  baseTokenSymbol: optionalStr,
});
export type ValidatedDexToken = z.infer<typeof DexTokenSchema>;

// ─── Combined API Response ────────────────────────────────────

export const CombinedApiDataSchema = z.object({
  cmc: z.record(z.string(), CMCTokenSchema),
  dex: z.record(z.string(), DexTokenSchema),
  timestamp: z.coerce.number().positive(),
});
export type ValidatedCombinedApiData = z.infer<typeof CombinedApiDataSchema>;

// ─── Moralis ──────────────────────────────────────────────────

export const MoralisTokenPriceSchema = z.object({
  tokenName: z.string().default('Unknown'),
  tokenSymbol: z.string().default('???'),
  tokenDecimals: z.string().default('18'),
  nativePrice: z.object({
    value: z.string(),
    decimals: z.coerce.number(),
    name: z.string(),
    symbol: z.string(),
  }).optional(),
  usdPrice: z.coerce.number().nonnegative(),
  usdPriceFormatted: z.string().optional(),
  '24hrPercentChange': z.string().optional(),
  exchangeName: z.string().optional(),
  exchangeAddress: z.string().optional(),
  tokenAddress: z.string().min(1),
});

export const MoralisTransactionSchema = z.object({
  hash: z.string().min(1),
  from_address: z.string().min(1),
  to_address: z.string().min(1),
  value: z.string().default('0'),
  block_timestamp: z.string().min(1),
  block_number: z.string().default('0'),
  gas: z.string().optional(),
  gas_price: z.string().optional(),
  receipt_status: z.string().optional(),
});

export const MoralisErc20TransferSchema = z.object({
  transaction_hash: z.string().min(1),
  from_address: z.string().min(1),
  to_address: z.string().min(1),
  value: z.string().default('0'),
  token_name: z.string().default('Unknown'),
  token_symbol: z.string().default('???'),
  token_decimals: z.string().default('18'),
  block_timestamp: z.string().min(1),
  address: z.string().min(1),
});

// ─── Wallet Scanner ───────────────────────────────────────────

const LinkStrengthSchema = z.enum(['strong', 'medium', 'weak']);

export const CounterpartySchema = z.object({
  address: z.string().min(1),
  isContract: z.boolean().default(false),
  txCount: safePositiveNum,
  volumeIn: safePositiveNum,
  volumeOut: safePositiveNum,
  firstSeen: optionalStr,
  lastSeen: optionalStr,
  bidirectional: z.boolean().default(false),
  tokenDiversity: safePositiveNum,
  linkScore: safeNum,
  linkStrength: LinkStrengthSchema,
});

export const WalletScanResultSchema = z.object({
  scanId: z.string().uuid(),
  address: z.string().min(1),
  chain: z.string().min(1),
  status: z.string().min(1),
  totalTxCount: safePositiveNum,
  totalVolumeIn: safePositiveNum,
  totalVolumeOut: safePositiveNum,
  firstSeen: optionalStr,
  lastSeen: optionalStr,
  counterparties: z.array(CounterpartySchema).default([]),
  contracts: z.array(z.object({
    address: z.string().min(1),
    txCount: safePositiveNum,
    isRouter: z.boolean().default(false),
    label: optionalStr,
  })).default([]),
  topSources: z.array(CounterpartySchema).default([]),
  topDestinations: z.array(CounterpartySchema).default([]),
  cluster: z.array(z.object({
    address: z.string().min(1),
    role: z.enum(['seed', 'core', 'associated', 'peripheral']),
    linkScore: safeNum,
    depth: safeNum,
  })).default([]),
  clusterEdges: z.array(z.object({
    source: z.string().min(1),
    target: z.string().min(1),
    txCount: safePositiveNum,
    totalVolume: safePositiveNum,
    strength: LinkStrengthSchema,
  })).default([]),
  depth: z.coerce.number().int().min(1).max(3).default(1),
});

// ─── Token Intel ──────────────────────────────────────────────

export const TokenHolderSchema = z.object({
  address: z.string().min(1),
  balance: z.string().default('0'),
  balanceFormatted: z.string().default('0'),
  pctOfSupply: safeNum,
});

export const ConcentrationMetricsSchema = z.object({
  top10Pct: safeNum,
  top25Pct: safeNum,
  top50Pct: safeNum,
  giniApprox: safeNum,
  holderCount: optionalNum,
});

export const TokenHoldersResponseSchema = z.object({
  tokenAddress: z.string().min(1),
  chain: z.string().min(1),
  holders: z.array(TokenHolderSchema).default([]),
  metrics: ConcentrationMetricsSchema,
  cursor: optionalStr,
  estimated: z.boolean().default(false),
});

// ─── Alerts (DB) ──────────────────────────────────────────────

export const AlertSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export const AlertStatusSchema = z.enum(['new', 'read', 'dismissed', 'resolved']);

export const DbAlertSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().default(''),
  severity: AlertSeveritySchema,
  status: AlertStatusSchema,
  scope: z.string().min(1),
  subject: optionalStr,
  chain: z.string().default('cronos'),
  evidence: z.record(z.unknown()).default({}),
  rule_id: optionalStr,
  user_id: optionalStr,
  created_at: z.string(),
});
