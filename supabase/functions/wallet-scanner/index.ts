import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

// Known DeFi router/aggregator contracts to optionally exclude
const KNOWN_ROUTERS = new Set([
  "0x145863eb42cf62847a6ca784e6416c1682b1b2ae", // VVS Finance Router
  "0xeC0A7a0C2439E8Cb67b992b12ecd020Ea943c7Be", // MM Finance Router
  "0x7a250d5630b4cf539739df2c5dacb4c659f2488d", // Uniswap V2 Router
]);

const MAX_PAGES = 20;
const MAX_NODES = 500;
const MAX_EDGES = 2000;

// ---------- Types ----------

interface MoralisTx {
  hash: string;
  from_address: string;
  to_address: string;
  value: string;
  block_timestamp: string;
  block_number: string;
  gas: string;
  receipt_status: string;
  receipt_contract_address?: string;
}

interface MoralisTransfer {
  transaction_hash: string;
  from_address: string;
  to_address: string;
  value: string;
  token_decimals?: string;
  token_symbol?: string;
  address: string; // token contract
  block_timestamp: string;
}

interface CounterpartyData {
  address: string;
  isContract: boolean;
  txCount: number;
  volumeIn: number;
  volumeOut: number;
  firstSeen: number;
  lastSeen: number;
  tokens: Set<string>;
  bidirectional: boolean;
  inCount: number;
  outCount: number;
}

interface ScanResult {
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

interface CounterpartyResult {
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

interface ContractResult {
  address: string;
  txCount: number;
  isRouter: boolean;
  label: string | null;
}

interface ClusterNode {
  address: string;
  role: "seed" | "core" | "associated" | "peripheral";
  linkScore: number;
  depth: number;
}

interface ClusterEdgeResult {
  source: string;
  target: string;
  txCount: number;
  totalVolume: number;
  strength: "strong" | "medium" | "weak";
}

// ---------- Moralis fetcher with retry ----------

async function fetchMoralis(
  apiKey: string,
  path: string,
  params: Record<string, string> = {}
): Promise<unknown> {
  const url = new URL(`${MORALIS_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url.toString(), {
        headers: { "X-API-Key": apiKey, Accept: "application/json" },
      });
      if (res.status === 429 && attempt < 2) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      const data = await res.json();
      if (!res.ok)
        throw new Error(`Moralis ${res.status}: ${JSON.stringify(data).slice(0, 200)}`);
      return data;
    } catch (err) {
      if (attempt === 2) throw err;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw new Error("Moralis fetch failed");
}

// ---------- Full paginated tx fetch ----------

async function fetchAllTransactions(
  apiKey: string,
  address: string,
  chainHex: string
): Promise<MoralisTx[]> {
  const allTxs: MoralisTx[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const params: Record<string, string> = {
      chain: chainHex,
      limit: "100",
      order: "DESC",
    };
    if (cursor) params.cursor = cursor;

    const raw = (await fetchMoralis(apiKey, `/${address}`, params)) as {
      result?: MoralisTx[];
      cursor?: string;
    };

    allTxs.push(...(raw.result ?? []));
    cursor = raw.cursor;
    if (!cursor || (raw.result?.length ?? 0) < 100) break;
  }

  return allTxs;
}

async function fetchAllTokenTransfers(
  apiKey: string,
  address: string,
  chainHex: string
): Promise<MoralisTransfer[]> {
  const allTransfers: MoralisTransfer[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const params: Record<string, string> = {
      chain: chainHex,
      limit: "100",
      order: "DESC",
    };
    if (cursor) params.cursor = cursor;

    try {
      const raw = (await fetchMoralis(
        apiKey,
        `/${address}/erc20/transfers`,
        params
      )) as { result?: MoralisTransfer[]; cursor?: string };

      allTransfers.push(...(raw.result ?? []));
      cursor = raw.cursor;
      if (!cursor || (raw.result?.length ?? 0) < 100) break;
    } catch {
      break;
    }
  }

  return allTransfers;
}

// ---------- Counterparty extraction ----------

function extractCounterparties(
  seedAddress: string,
  txs: MoralisTx[],
  tokenTransfers: MoralisTransfer[],
  includeRouters: boolean
): Map<string, CounterpartyData> {
  const seed = seedAddress.toLowerCase();
  const counterparties = new Map<string, CounterpartyData>();

  function getOrCreate(addr: string): CounterpartyData {
    const existing = counterparties.get(addr);
    if (existing) return existing;
    const cp: CounterpartyData = {
      address: addr,
      isContract: false,
      txCount: 0,
      volumeIn: 0,
      volumeOut: 0,
      firstSeen: Infinity,
      lastSeen: 0,
      tokens: new Set(),
      bidirectional: false,
      inCount: 0,
      outCount: 0,
    };
    counterparties.set(addr, cp);
    return cp;
  }

  // Process native transactions
  for (const tx of txs) {
    const from = tx.from_address?.toLowerCase();
    const to = tx.to_address?.toLowerCase();
    if (!from || !to) continue;

    const counterpartyAddr = from === seed ? to : from;
    if (counterpartyAddr === seed) continue;
    if (!includeRouters && KNOWN_ROUTERS.has(counterpartyAddr)) continue;

    const cp = getOrCreate(counterpartyAddr);
    const valueWei = BigInt(tx.value || "0");
    const valueCro = Number(valueWei) / 1e18;
    const ts = new Date(tx.block_timestamp).getTime();

    cp.txCount++;
    cp.tokens.add("CRO");
    cp.firstSeen = Math.min(cp.firstSeen, ts);
    cp.lastSeen = Math.max(cp.lastSeen, ts);

    if (from === seed) {
      cp.volumeOut += valueCro;
      cp.outCount++;
    } else {
      cp.volumeIn += valueCro;
      cp.inCount++;
    }

    // Detect contract creation
    if (tx.receipt_contract_address) {
      cp.isContract = true;
    }
  }

  // Process token transfers
  for (const tx of tokenTransfers) {
    const from = tx.from_address?.toLowerCase();
    const to = tx.to_address?.toLowerCase();
    if (!from || !to) continue;

    const counterpartyAddr = from === seed ? to : from;
    if (counterpartyAddr === seed) continue;
    if (!includeRouters && KNOWN_ROUTERS.has(counterpartyAddr)) continue;

    const cp = getOrCreate(counterpartyAddr);
    const decimals = parseInt(tx.token_decimals ?? "18", 10);
    const value = parseFloat(tx.value) / Math.pow(10, decimals);
    const ts = new Date(tx.block_timestamp).getTime();

    cp.txCount++;
    cp.tokens.add(tx.token_symbol ?? tx.address);
    cp.firstSeen = Math.min(cp.firstSeen, ts);
    cp.lastSeen = Math.max(cp.lastSeen, ts);

    if (from === seed) {
      cp.volumeOut += value;
      cp.outCount++;
    } else {
      cp.volumeIn += value;
      cp.inCount++;
    }
  }

  // Mark bidirectional
  for (const cp of counterparties.values()) {
    cp.bidirectional = cp.inCount > 0 && cp.outCount > 0;
    if (cp.firstSeen === Infinity) cp.firstSeen = 0;
  }

  return counterparties;
}

// ---------- Link scoring ----------

function scoreLinkStrength(cp: CounterpartyData): {
  score: number;
  strength: "strong" | "medium" | "weak";
} {
  const now = Date.now();
  const recencyDays = (now - cp.lastSeen) / 86400_000;

  // Frequency factor (log scale, max 30 pts)
  const freqScore = Math.min(30, Math.log2(cp.txCount + 1) * 10);

  // Volume factor (log scale, max 25 pts)
  const totalVol = cp.volumeIn + cp.volumeOut;
  const volScore = Math.min(25, Math.log10(totalVol + 1) * 8);

  // Recency factor (max 20 pts, decays over 90 days)
  const recencyScore = Math.max(0, 20 * (1 - recencyDays / 90));

  // Bidirectional bonus (15 pts)
  const biDirScore = cp.bidirectional ? 15 : 0;

  // Token diversity bonus (max 10 pts)
  const diversityScore = Math.min(10, cp.tokens.size * 3);

  const score = freqScore + volScore + recencyScore + biDirScore + diversityScore;
  const normalizedScore = Math.min(100, score);

  let strength: "strong" | "medium" | "weak";
  if (normalizedScore >= 60) strength = "strong";
  else if (normalizedScore >= 30) strength = "medium";
  else strength = "weak";

  return { score: Math.round(normalizedScore * 10) / 10, strength };
}

// ---------- Graph expansion ----------

async function expandGraph(
  apiKey: string,
  seedAddress: string,
  chainHex: string,
  chain: string,
  depth: number,
  includeRouters: boolean,
  counterparties: Map<string, CounterpartyData>
): Promise<{ nodes: ClusterNode[]; edges: ClusterEdgeResult[] }> {
  const visited = new Set<string>([seedAddress.toLowerCase()]);
  const nodes: ClusterNode[] = [
    { address: seedAddress.toLowerCase(), role: "seed", linkScore: 100, depth: 0 },
  ];
  const edges: ClusterEdgeResult[] = [];

  // Add depth 1 nodes from existing counterparties
  const strongCps = [...counterparties.entries()]
    .map(([addr, cp]) => ({ addr, cp, ...scoreLinkStrength(cp) }))
    .filter((x) => x.score >= 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);

  for (const { addr, cp, score, strength } of strongCps) {
    visited.add(addr);
    nodes.push({
      address: addr,
      role: score >= 60 ? "core" : "associated",
      linkScore: score,
      depth: 1,
    });
    edges.push({
      source: seedAddress.toLowerCase(),
      target: addr,
      txCount: cp.txCount,
      totalVolume: cp.volumeIn + cp.volumeOut,
      strength,
    });
  }

  // Depth 2+ expansion
  if (depth >= 2 && nodes.length < MAX_NODES) {
    const depth1Addrs = strongCps
      .filter((x) => x.score >= 40)
      .slice(0, 10)
      .map((x) => x.addr);

    for (const addr of depth1Addrs) {
      if (nodes.length >= MAX_NODES || edges.length >= MAX_EDGES) break;

      try {
        const subTxs = await fetchAllTransactions(apiKey, addr, chainHex);
        const subTransfers = await fetchAllTokenTransfers(apiKey, addr, chainHex);
        const subCps = extractCounterparties(addr, subTxs, subTransfers, includeRouters);

        const subStrong = [...subCps.entries()]
          .map(([a, cp]) => ({ a, cp, ...scoreLinkStrength(cp) }))
          .filter((x) => x.score >= 35 && !visited.has(x.a))
          .sort((a, b) => b.score - a.score)
          .slice(0, 15);

        for (const { a, cp, score, strength } of subStrong) {
          if (nodes.length >= MAX_NODES) break;
          visited.add(a);
          nodes.push({
            address: a,
            role: score >= 50 ? "associated" : "peripheral",
            linkScore: score,
            depth: 2,
          });
          edges.push({
            source: addr,
            target: a,
            txCount: cp.txCount,
            totalVolume: cp.volumeIn + cp.volumeOut,
            strength,
          });
        }
      } catch {
        // Skip failed expansions
      }
    }
  }

  // Depth 3 expansion
  if (depth >= 3 && nodes.length < MAX_NODES) {
    const depth2Addrs = nodes
      .filter((n) => n.depth === 2 && n.linkScore >= 50)
      .slice(0, 5)
      .map((n) => n.address);

    for (const addr of depth2Addrs) {
      if (nodes.length >= MAX_NODES || edges.length >= MAX_EDGES) break;

      try {
        const subTxs = await fetchAllTransactions(apiKey, addr, chainHex);
        const subTransfers = await fetchAllTokenTransfers(apiKey, addr, chainHex);
        const subCps = extractCounterparties(addr, subTxs, subTransfers, includeRouters);

        const subStrong = [...subCps.entries()]
          .map(([a, cp]) => ({ a, cp, ...scoreLinkStrength(cp) }))
          .filter((x) => x.score >= 45 && !visited.has(x.a))
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        for (const { a, cp, score, strength } of subStrong) {
          if (nodes.length >= MAX_NODES) break;
          visited.add(a);
          nodes.push({
            address: a,
            role: "peripheral",
            linkScore: score,
            depth: 3,
          });
          edges.push({
            source: addr,
            target: a,
            txCount: cp.txCount,
            totalVolume: cp.volumeIn + cp.volumeOut,
            strength,
          });
        }
      } catch {
        // Skip
      }
    }
  }

  return { nodes, edges };
}

// ---------- Contract detection ----------

function extractContracts(
  txs: MoralisTx[],
  counterparties: Map<string, CounterpartyData>
): ContractResult[] {
  const contractMap = new Map<string, { txCount: number; isRouter: boolean }>();

  for (const tx of txs) {
    const to = tx.to_address?.toLowerCase();
    if (!to) continue;

    // Heuristic: if 0 value + has gas, likely contract interaction
    const valueWei = BigInt(tx.value || "0");
    if (valueWei === 0n || tx.receipt_contract_address) {
      const entry = contractMap.get(to) ?? { txCount: 0, isRouter: false };
      entry.txCount++;
      entry.isRouter = KNOWN_ROUTERS.has(to);
      contractMap.set(to, entry);
    }
  }

  // Also mark counterparties flagged as contracts
  for (const [addr, cp] of counterparties) {
    if (cp.isContract && !contractMap.has(addr)) {
      contractMap.set(addr, { txCount: cp.txCount, isRouter: KNOWN_ROUTERS.has(addr) });
    }
  }

  return [...contractMap.entries()]
    .map(([address, data]) => ({
      address,
      txCount: data.txCount,
      isRouter: data.isRouter,
      label: data.isRouter ? "DEX Router" : null,
    }))
    .sort((a, b) => b.txCount - a.txCount)
    .slice(0, 50);
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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    const {
      address,
      chain = "cronos",
      depth = 1,
      includeRouters = false,
      scoreThreshold = 20,
    } = body as {
      address?: string;
      chain?: string;
      depth?: number;
      includeRouters?: boolean;
      scoreThreshold?: number;
    };

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return new Response(
        JSON.stringify({ error: "Invalid wallet address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedAddr = address.toLowerCase();
    const chainHex = CHAIN_MAP[chain] ?? CHAIN_MAP.cronos;
    const clampedDepth = Math.min(Math.max(depth, 1), 3);

    // Check for recent cached scan (< 5 min)
    const { data: existingScan } = await supabase
      .from("wallet_scans")
      .select("*")
      .eq("address", normalizedAddr)
      .eq("chain", chain)
      .eq("depth", clampedDepth)
      .eq("status", "completed")
      .gte("created_at", new Date(Date.now() - 5 * 60_000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existingScan?.result && Object.keys(existingScan.result as Record<string, unknown>).length > 0) {
      return new Response(JSON.stringify(existingScan.result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create scan record
    const { data: scanRecord } = await supabase
      .from("wallet_scans")
      .insert({
        address: normalizedAddr,
        chain,
        depth: clampedDepth,
        include_routers: includeRouters,
        status: "running",
      })
      .select("id")
      .single();

    const scanId = scanRecord?.id ?? crypto.randomUUID();

    // 1. Fetch full transaction history
    const [allTxs, allTokenTransfers] = await Promise.all([
      fetchAllTransactions(apiKey, normalizedAddr, chainHex),
      fetchAllTokenTransfers(apiKey, normalizedAddr, chainHex),
    ]);

    // 2. Extract counterparties
    const counterparties = extractCounterparties(
      normalizedAddr,
      allTxs,
      allTokenTransfers,
      includeRouters
    );

    // 3. Score all counterparties
    const scoredCounterparties: CounterpartyResult[] = [...counterparties.entries()]
      .map(([addr, cp]) => {
        const { score, strength } = scoreLinkStrength(cp);
        return {
          address: addr,
          isContract: cp.isContract,
          txCount: cp.txCount,
          volumeIn: Math.round(cp.volumeIn * 1e6) / 1e6,
          volumeOut: Math.round(cp.volumeOut * 1e6) / 1e6,
          firstSeen: cp.firstSeen > 0 ? new Date(cp.firstSeen).toISOString() : null,
          lastSeen: cp.lastSeen > 0 ? new Date(cp.lastSeen).toISOString() : null,
          bidirectional: cp.bidirectional,
          tokenDiversity: cp.tokens.size,
          linkScore: score,
          linkStrength: strength,
        };
      })
      .sort((a, b) => b.linkScore - a.linkScore);

    // 4. Compute summary stats
    let firstSeen = Infinity;
    let lastSeen = 0;
    let totalVolumeIn = 0;
    let totalVolumeOut = 0;

    for (const tx of allTxs) {
      const ts = new Date(tx.block_timestamp).getTime();
      firstSeen = Math.min(firstSeen, ts);
      lastSeen = Math.max(lastSeen, ts);
      const valueWei = BigInt(tx.value || "0");
      const valueCro = Number(valueWei) / 1e18;
      if (tx.from_address?.toLowerCase() === normalizedAddr) {
        totalVolumeOut += valueCro;
      } else {
        totalVolumeIn += valueCro;
      }
    }

    // 5. Extract contracts
    const contracts = extractContracts(allTxs, counterparties);

    // 6. Graph expansion
    const { nodes: clusterNodes, edges: clusterEdges } = await expandGraph(
      apiKey,
      normalizedAddr,
      chainHex,
      chain,
      clampedDepth,
      includeRouters,
      counterparties
    );

    // 7. Build result
    const topSources = scoredCounterparties
      .filter((cp) => cp.volumeIn > 0)
      .sort((a, b) => b.volumeIn - a.volumeIn)
      .slice(0, 10);

    const topDestinations = scoredCounterparties
      .filter((cp) => cp.volumeOut > 0)
      .sort((a, b) => b.volumeOut - a.volumeOut)
      .slice(0, 10);

    const result: ScanResult = {
      scanId,
      address: normalizedAddr,
      chain,
      status: "completed",
      totalTxCount: allTxs.length + allTokenTransfers.length,
      totalVolumeIn: Math.round(totalVolumeIn * 1e4) / 1e4,
      totalVolumeOut: Math.round(totalVolumeOut * 1e4) / 1e4,
      firstSeen: firstSeen < Infinity ? new Date(firstSeen).toISOString() : null,
      lastSeen: lastSeen > 0 ? new Date(lastSeen).toISOString() : null,
      counterparties: scoredCounterparties.filter(
        (cp) => cp.linkScore >= scoreThreshold
      ),
      contracts,
      topSources,
      topDestinations,
      cluster: clusterNodes,
      clusterEdges,
      depth: clampedDepth,
    };

    // 8. Persist scan result
    await supabase
      .from("wallet_scans")
      .update({
        status: "completed",
        total_tx_count: result.totalTxCount,
        total_volume_in: result.totalVolumeIn,
        total_volume_out: result.totalVolumeOut,
        first_seen: result.firstSeen,
        last_seen: result.lastSeen,
        counterparties_count: scoredCounterparties.length,
        contracts_count: contracts.length,
        result: result as unknown as Record<string, unknown>,
      })
      .eq("id", scanId);

    // 9. Cache counterparties
    const cpInserts = scoredCounterparties.slice(0, 200).map((cp) => ({
      scan_id: scanId,
      address: cp.address,
      is_contract: cp.isContract,
      tx_count: cp.txCount,
      volume_in: cp.volumeIn,
      volume_out: cp.volumeOut,
      first_seen: cp.firstSeen,
      last_seen: cp.lastSeen,
      bidirectional: cp.bidirectional,
      token_diversity: cp.tokenDiversity,
      link_score: cp.linkScore,
      link_strength: cp.linkStrength,
    }));

    if (cpInserts.length > 0) {
      await supabase.from("wallet_counterparties").insert(cpInserts);
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
