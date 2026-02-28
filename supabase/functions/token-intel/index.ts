import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MORALIS_BASE = "https://deep-index.moralis.io/api/v2.2";

const CHAIN_MAP: Record<string, string> = {
  cronos: "0x19",
  ethereum: "0x1",
  bsc: "0x38",
  polygon: "0x89",
  arbitrum: "0xa4b1",
  base: "0x2105",
};

// ---------- Types ----------

interface TokenSummary {
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

interface Holder {
  address: string;
  balance: string;
  balanceFormatted: string;
  pctOfSupply: number;
}

interface ConcentrationMetrics {
  top10Pct: number;
  top25Pct: number;
  top50Pct: number;
  giniApprox: number;
  holderCount: number | null;
}

interface HoldersResponse {
  tokenAddress: string;
  chain: string;
  holders: Holder[];
  metrics: ConcentrationMetrics;
  cursor: string | null;
  estimated: boolean;
}

interface BubblemapNode {
  id: string;
  label: string;
  size: number;
  pctOfSupply: number;
  tags: string[];
}

interface BubblemapEdge {
  source: string;
  target: string;
  weight: number;
  txCount: number;
  netFlow: number;
}

interface BubblemapSignals {
  loopsDetected: boolean;
  lpNodes: string[];
  contracts: string[];
  freshWallets: string[];
}

interface BubblemapResponse {
  tokenAddress: string;
  chain: string;
  nodes: BubblemapNode[];
  edges: BubblemapEdge[];
  signals: BubblemapSignals;
}

// ---------- Cache ----------

const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 60_000; // 60s

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    if (entry) cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown, ttl = CACHE_TTL_MS): void {
  cache.set(key, { data, expiresAt: Date.now() + ttl });
  // Evict old entries when cache gets large
  if (cache.size > 200) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now > v.expiresAt) cache.delete(k);
    }
  }
}

// ---------- Moralis fetcher with retry ----------

async function fetchMoralis(
  apiKey: string,
  path: string,
  params: Record<string, string> = {}
): Promise<unknown> {
  const url = new URL(`${MORALIS_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url.toString(), {
        headers: { "X-API-Key": apiKey, Accept: "application/json" },
      });

      if (res.status === 429 && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(`Moralis ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
      }
      return data;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }
  throw lastError ?? new Error("Moralis fetch failed");
}

// ---------- Handlers ----------

async function handleSummary(
  apiKey: string,
  tokenAddress: string,
  chainHex: string,
  chainName: string
): Promise<TokenSummary> {
  const cacheKey = `summary:${tokenAddress}:${chainHex}`;
  const cached = getCached<TokenSummary>(cacheKey);
  if (cached) return cached;

  // Fetch metadata
  const metaRaw = (await fetchMoralis(apiKey, `/erc20/metadata`, {
    chain: chainHex,
    addresses: tokenAddress,
  })) as Array<{
    address: string;
    name: string;
    symbol: string;
    decimals: string;
    total_supply: string | null;
    logo: string | null;
    thumbnail: string | null;
  }>;

  const meta = Array.isArray(metaRaw) ? metaRaw[0] : null;
  if (!meta) throw new Error("Token not found");

  // Try to fetch price (non-critical)
  let price: number | null = null;
  let priceChange24h: number | null = null;
  try {
    const priceData = (await fetchMoralis(apiKey, `/erc20/${tokenAddress}/price`, {
      chain: chainHex,
    })) as { usdPrice?: number; "24hrPercentChange"?: string };
    price = priceData.usdPrice ?? null;
    priceChange24h = priceData["24hrPercentChange"]
      ? parseFloat(priceData["24hrPercentChange"])
      : null;
  } catch {
    // Price not available for all tokens
  }

  const result: TokenSummary = {
    tokenAddress: meta.address,
    name: meta.name,
    symbol: meta.symbol,
    decimals: parseInt(meta.decimals, 10),
    totalSupply: meta.total_supply,
    logo: meta.logo || meta.thumbnail,
    chain: chainName,
    price,
    priceChange24h,
  };

  setCache(cacheKey, result);
  return result;
}

async function handleHolders(
  apiKey: string,
  tokenAddress: string,
  chainHex: string,
  chainName: string,
  limit: number,
  cursor?: string
): Promise<HoldersResponse> {
  const cacheKey = `holders:${tokenAddress}:${chainHex}:${limit}:${cursor ?? ""}`;
  const cached = getCached<HoldersResponse>(cacheKey);
  if (cached) return cached;

  const params: Record<string, string> = {
    chain: chainHex,
    limit: String(Math.min(limit, 100)),
    order: "DESC",
  };
  if (cursor) params.cursor = cursor;

  let holders: Holder[] = [];
  let nextCursor: string | null = null;
  let estimated = false;
  let holderCount: number | null = null;

  try {
    // Try Moralis token holders endpoint
    const raw = (await fetchMoralis(
      apiKey,
      `/erc20/${tokenAddress}/owners`,
      params
    )) as {
      result?: Array<{
        owner_address: string;
        balance: string;
        balance_formatted: string;
        percentage_relative_to_total_supply: number;
        is_contract: boolean;
      }>;
      cursor?: string;
    };

    holders = (raw.result ?? []).map((h) => ({
      address: h.owner_address,
      balance: h.balance,
      balanceFormatted: h.balance_formatted,
      pctOfSupply: h.percentage_relative_to_total_supply ?? 0,
    }));
    nextCursor = raw.cursor ?? null;
  } catch {
    // Fallback: estimate top holders from transfers
    estimated = true;
    try {
      const transfers = (await fetchMoralis(
        apiKey,
        `/erc20/${tokenAddress}/transfers`,
        { chain: chainHex, limit: "100", order: "DESC" }
      )) as {
        result?: Array<{
          to_address: string;
          from_address: string;
          value: string;
          token_decimals: string;
        }>;
      };

      // Approximate balances from transfers
      const balances = new Map<string, number>();
      const decimals = parseInt(
        (transfers.result?.[0]?.token_decimals ?? "18"),
        10
      );

      for (const tx of transfers.result ?? []) {
        const val = parseFloat(tx.value) / Math.pow(10, decimals);
        balances.set(
          tx.to_address,
          (balances.get(tx.to_address) ?? 0) + val
        );
        balances.set(
          tx.from_address,
          (balances.get(tx.from_address) ?? 0) - val
        );
      }

      const sorted = [...balances.entries()]
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);

      const totalEstimated = sorted.reduce((s, [, v]) => s + v, 0);

      holders = sorted.map(([addr, bal]) => ({
        address: addr,
        balance: bal.toFixed(0),
        balanceFormatted: bal.toFixed(4),
        pctOfSupply: totalEstimated > 0 ? (bal / totalEstimated) * 100 : 0,
      }));
    } catch {
      // Both methods failed
    }
  }

  // Compute concentration metrics
  const totalPct = holders.reduce((s, h) => s + h.pctOfSupply, 0);
  const sortedPcts = holders
    .map((h) => h.pctOfSupply)
    .sort((a, b) => b - a);

  const top10Pct = sortedPcts.slice(0, 10).reduce((s, p) => s + p, 0);
  const top25Pct = sortedPcts.slice(0, 25).reduce((s, p) => s + p, 0);
  const top50Pct = sortedPcts.slice(0, 50).reduce((s, p) => s + p, 0);

  // Approximate Gini coefficient
  const n = sortedPcts.length;
  let giniApprox = 0;
  if (n > 1 && totalPct > 0) {
    const normalized = sortedPcts.map((p) => p / totalPct);
    let sumAbsDiff = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        sumAbsDiff += Math.abs(normalized[i] - normalized[j]);
      }
    }
    giniApprox = sumAbsDiff / (n * n * (1 / n));
    giniApprox = Math.min(1, Math.max(0, giniApprox));
  }

  const result: HoldersResponse = {
    tokenAddress,
    chain: chainName,
    holders,
    metrics: { top10Pct, top25Pct, top50Pct, giniApprox, holderCount },
    cursor: nextCursor,
    estimated,
  };

  setCache(cacheKey, result);
  return result;
}

async function handleBubblemap(
  apiKey: string,
  tokenAddress: string,
  chainHex: string,
  chainName: string,
  top: number,
  windowDays: number
): Promise<BubblemapResponse> {
  const cacheKey = `bubblemap:${tokenAddress}:${chainHex}:${top}:${windowDays}`;
  const cached = getCached<BubblemapResponse>(cacheKey);
  if (cached) return cached;

  // Step 1: Get top holders for nodes
  const holdersData = await handleHolders(
    apiKey,
    tokenAddress,
    chainHex,
    chainName,
    top
  );

  // Step 2: Get recent transfers between these holders
  const holderAddrs = new Set(holdersData.holders.map((h) => h.address.toLowerCase()));

  let transfers: Array<{
    from_address: string;
    to_address: string;
    value: string;
    token_decimals: string;
    block_timestamp: string;
    to_address_label?: string;
    from_address_label?: string;
  }> = [];

  try {
    const fromDate = new Date(
      Date.now() - windowDays * 24 * 60 * 60 * 1000
    ).toISOString();

    const raw = (await fetchMoralis(
      apiKey,
      `/erc20/${tokenAddress}/transfers`,
      {
        chain: chainHex,
        limit: "100",
        order: "DESC",
        from_date: fromDate,
      }
    )) as { result?: typeof transfers };

    transfers = raw.result ?? [];
  } catch {
    // Transfers unavailable
  }

  // Step 3: Build edges from transfers between top holders
  const edgeMap = new Map<
    string,
    { txCount: number; totalFlow: number; netFlow: number }
  >();

  const decimals = transfers[0]
    ? parseInt(transfers[0].token_decimals ?? "18", 10)
    : 18;

  const contractAddrs = new Set<string>();
  const freshWallets = new Set<string>();
  const lpKeywords = ["pool", "lp", "liquidity", "pair", "swap", "router"];

  for (const tx of transfers) {
    const from = tx.from_address.toLowerCase();
    const to = tx.to_address.toLowerCase();
    const value = parseFloat(tx.value) / Math.pow(10, decimals);

    // Track if addresses appear in holder set
    if (holderAddrs.has(from) && holderAddrs.has(to)) {
      const key = [from, to].sort().join(":");
      const existing = edgeMap.get(key) ?? {
        txCount: 0,
        totalFlow: 0,
        netFlow: 0,
      };
      existing.txCount++;
      existing.totalFlow += value;
      existing.netFlow += from < to ? value : -value;
      edgeMap.set(key, existing);
    }

    // Detect fresh wallets (first tx within window)
    const txAge =
      (Date.now() - new Date(tx.block_timestamp).getTime()) / (1000 * 3600);
    if (txAge < 24) {
      freshWallets.add(to);
    }
  }

  // Build nodes
  const lpNodes: string[] = [];
  const nodes: BubblemapNode[] = holdersData.holders.map((h) => {
    const addr = h.address.toLowerCase();
    const tags: string[] = [];

    // Tag detection (heuristic based on labels or known patterns)
    const isContract = contractAddrs.has(addr);
    if (isContract) tags.push("contract");
    if (freshWallets.has(addr)) tags.push("fresh");

    // LP detection heuristic
    const label = addr.slice(0, 8);
    if (lpKeywords.some((kw) => label.includes(kw))) {
      tags.push("lp");
      lpNodes.push(addr);
    }

    return {
      id: addr,
      label: `${addr.slice(0, 6)}...${addr.slice(-4)}`,
      size: h.pctOfSupply,
      pctOfSupply: h.pctOfSupply,
      tags,
    };
  });

  // Build edges
  const edges: BubblemapEdge[] = [];
  for (const [key, data] of edgeMap) {
    const [source, target] = key.split(":");
    edges.push({
      source,
      target,
      weight: data.totalFlow,
      txCount: data.txCount,
      netFlow: data.netFlow,
    });
  }

  // Simple loop detection (A->B->C->A within edges)
  let loopsDetected = false;
  const adjacency = new Map<string, Set<string>>();
  for (const e of edges) {
    if (!adjacency.has(e.source)) adjacency.set(e.source, new Set());
    adjacency.get(e.source)!.add(e.target);
    if (!adjacency.has(e.target)) adjacency.set(e.target, new Set());
    adjacency.get(e.target)!.add(e.source);
  }

  // Check for triangles (3-cycles)
  outerLoop: for (const [a, neighbors] of adjacency) {
    for (const b of neighbors) {
      const bNeighbors = adjacency.get(b);
      if (!bNeighbors) continue;
      for (const c of bNeighbors) {
        if (c !== a && neighbors.has(c)) {
          loopsDetected = true;
          break outerLoop;
        }
      }
    }
  }

  const result: BubblemapResponse = {
    tokenAddress,
    chain: chainName,
    nodes,
    edges,
    signals: {
      loopsDetected,
      lpNodes,
      contracts: [...contractAddrs],
      freshWallets: [...freshWallets].filter((w) => holderAddrs.has(w)),
    },
  };

  setCache(cacheKey, result, 120_000); // 2min cache for graph data
  return result;
}

// ---------- Main handler ----------

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("MORALIS_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "MORALIS_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const {
      action,
      tokenAddress,
      chain = "cronos",
      limit = 50,
      cursor,
      top = 30,
      windowDays = 7,
    } = body as {
      action: "summary" | "holders" | "bubblemap";
      tokenAddress?: string;
      chain?: string;
      limit?: number;
      cursor?: string;
      top?: number;
      windowDays?: number;
    };

    if (!action || !tokenAddress || typeof tokenAddress !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing 'action' or 'tokenAddress'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
      return new Response(
        JSON.stringify({ error: "Invalid token address format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const chainHex = CHAIN_MAP[chain] ?? CHAIN_MAP.cronos;

    let result: unknown;

    switch (action) {
      case "summary":
        result = await handleSummary(apiKey, tokenAddress, chainHex, chain);
        break;
      case "holders":
        result = await handleHolders(
          apiKey,
          tokenAddress,
          chainHex,
          chain,
          limit,
          cursor
        );
        break;
      case "bubblemap":
        result = await handleBubblemap(
          apiKey,
          tokenAddress,
          chainHex,
          chain,
          top,
          windowDays
        );
        break;
      default:
        return new Response(
          JSON.stringify({
            error: "Invalid action. Use: summary, holders, bubblemap",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
