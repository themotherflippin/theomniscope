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
};

interface AlertRule {
  id: string;
  scope: string;
  chain: string;
  subject: string | null;
  rule_type: string;
  config: Record<string, unknown>;
  severity: string;
  name: string;
}

interface Watchlist {
  id: string;
  type: string;
  subject: string;
  chain: string;
}

interface ScanResult {
  rulesEvaluated: number;
  alertsCreated: number;
  errors: string[];
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function fetchMoralis(apiKey: string, path: string, params: Record<string, string> = {}): Promise<unknown> {
  const url = new URL(`${MORALIS_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: { "X-API-Key": apiKey, Accept: "application/json" },
  });

  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 2000));
    const retry = await fetch(url.toString(), {
      headers: { "X-API-Key": apiKey, Accept: "application/json" },
    });
    return retry.json();
  }

  return res.json();
}

function hashEvidence(evidence: Record<string, unknown>): string {
  const str = JSON.stringify(evidence, Object.keys(evidence).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("MORALIS_API_KEY");
  if (!apiKey) return jsonResponse({ error: "MORALIS_API_KEY not configured" }, 500);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const db = createClient(supabaseUrl, supabaseKey);

  const result: ScanResult = { rulesEvaluated: 0, alertsCreated: 0, errors: [] };

  try {
    // Load enabled rules and watchlists
    const [rulesRes, watchlistsRes] = await Promise.all([
      db.from("alert_rules").select("*").eq("is_enabled", true),
      db.from("watchlists").select("*").eq("is_enabled", true),
    ]);

    if (rulesRes.error) throw rulesRes.error;
    if (watchlistsRes.error) throw watchlistsRes.error;

    const rules = (rulesRes.data ?? []) as AlertRule[];
    const watchlists = (watchlistsRes.data ?? []) as Watchlist[];

    const walletWatchlists = watchlists.filter((w) => w.type === "wallet");
    const tokenWatchlists = watchlists.filter((w) => w.type === "token");

    // Evaluate each rule
    for (const rule of rules) {
      result.rulesEvaluated++;

      try {
        if (rule.rule_type === "large_transfer" && rule.scope === "wallet") {
          await evaluateLargeTransfer(db, apiKey, rule, walletWatchlists, result);
        } else if (rule.rule_type === "concentration_spike" && rule.scope === "token") {
          await evaluateConcentrationSpike(db, apiKey, rule, tokenWatchlists, result);
        } else if (rule.rule_type === "loop_suspicion" && rule.scope === "token") {
          await evaluateLoopSuspicion(db, apiKey, rule, tokenWatchlists, result);
        } else if (rule.rule_type === "fresh_wallet" && rule.scope === "wallet") {
          await evaluateFreshWallet(db, apiKey, rule, walletWatchlists, result);
        }
      } catch (err) {
        result.errors.push(`Rule ${rule.id} (${rule.rule_type}): ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return jsonResponse({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message, ...result }, 500);
  }
});

// --- Rule evaluators ---

async function createAlertIfNew(
  db: ReturnType<typeof createClient>,
  rule: AlertRule,
  subject: string,
  title: string,
  description: string,
  evidence: Record<string, unknown>,
  result: ScanResult
): Promise<void> {
  const dedupeKey = `${rule.id}:${subject}:${hashEvidence(evidence)}`;

  // Check dedupe
  const { data: existing } = await db
    .from("alert_state")
    .select("id")
    .eq("key", dedupeKey)
    .maybeSingle();

  if (existing) return; // Already created

  // Create alert
  const { error: alertError } = await db.from("alerts").insert({
    chain: rule.chain,
    scope: rule.scope,
    subject,
    rule_id: rule.id,
    severity: rule.severity,
    title,
    description,
    evidence,
  });

  if (alertError) {
    result.errors.push(`Failed to create alert: ${alertError.message}`);
    return;
  }

  // Mark dedupe
  await db.from("alert_state").upsert({
    key: dedupeKey,
    value: { createdAt: new Date().toISOString() },
  }, { onConflict: "key" });

  result.alertsCreated++;
}

async function evaluateLargeTransfer(
  db: ReturnType<typeof createClient>,
  apiKey: string,
  rule: AlertRule,
  wallets: Watchlist[],
  result: ScanResult
): Promise<void> {
  const threshold = Number(rule.config.thresholdUsd ?? 10000);
  const targets = rule.subject
    ? [{ subject: rule.subject, chain: rule.chain }]
    : wallets.filter((w) => w.chain === rule.chain);

  for (const target of targets.slice(0, 10)) { // Limit to prevent timeout
    const chainHex = CHAIN_MAP[target.chain] ?? CHAIN_MAP.cronos;

    const data = await fetchMoralis(apiKey, `/${target.subject}`, {
      chain: chainHex,
      limit: "10",
      order: "DESC",
    }) as { result?: Array<{ hash: string; value: string; from_address: string; to_address: string; block_timestamp: string }> };

    for (const tx of data.result ?? []) {
      const valueEth = Number(BigInt(tx.value || "0")) / 1e18;
      if (valueEth > threshold) {
        await createAlertIfNew(db, rule, target.subject,
          `Large transfer: ${valueEth.toFixed(2)} CRO`,
          `A transfer of ${valueEth.toLocaleString()} CRO (above ${threshold} threshold) was detected on wallet ${target.subject.slice(0, 10)}...`,
          { txHash: tx.hash, value: valueEth, from: tx.from_address, to: tx.to_address, timestamp: tx.block_timestamp },
          result
        );
      }
    }
  }
}

async function evaluateFreshWallet(
  db: ReturnType<typeof createClient>,
  apiKey: string,
  rule: AlertRule,
  wallets: Watchlist[],
  result: ScanResult
): Promise<void> {
  const targets = rule.subject
    ? [{ subject: rule.subject, chain: rule.chain }]
    : wallets.filter((w) => w.chain === rule.chain);

  for (const target of targets.slice(0, 10)) {
    const chainHex = CHAIN_MAP[target.chain] ?? CHAIN_MAP.cronos;

    const data = await fetchMoralis(apiKey, `/${target.subject}`, {
      chain: chainHex,
      limit: "1",
      order: "ASC",
    }) as { result?: Array<{ hash: string; block_timestamp: string }> };

    if (data.result && data.result.length > 0) {
      const firstTx = data.result[0];
      const ageHours = (Date.now() - new Date(firstTx.block_timestamp).getTime()) / (1000 * 60 * 60);

      if (ageHours < 24) {
        await createAlertIfNew(db, rule, target.subject,
          `Fresh wallet detected (<24h old)`,
          `Watched wallet ${target.subject.slice(0, 10)}... has its first transaction less than ${Math.round(ageHours)}h ago. This may indicate a newly created wallet.`,
          { firstTxHash: firstTx.hash, firstTxTime: firstTx.block_timestamp, ageHours: Math.round(ageHours) },
          result
        );
      }
    }
  }
}

async function evaluateConcentrationSpike(
  db: ReturnType<typeof createClient>,
  apiKey: string,
  rule: AlertRule,
  tokens: Watchlist[],
  result: ScanResult
): Promise<void> {
  const top10Threshold = Number(rule.config.top10PctThreshold ?? 80);
  const targets = rule.subject
    ? [{ subject: rule.subject, chain: rule.chain }]
    : tokens.filter((w) => w.chain === rule.chain);

  for (const target of targets.slice(0, 5)) {
    const chainHex = CHAIN_MAP[target.chain] ?? CHAIN_MAP.cronos;

    // Fetch token transfers to estimate top holders
    const data = await fetchMoralis(apiKey, `/erc20/${target.subject}/transfers`, {
      chain: chainHex,
      limit: "100",
      order: "DESC",
    }) as { result?: Array<{ to_address: string; value: string }> };

    if (!data.result?.length) continue;

    // Approximate top holders from transfers
    const balances = new Map<string, number>();
    for (const tx of data.result) {
      const val = Number(BigInt(tx.value || "0")) / 1e18;
      balances.set(tx.to_address, (balances.get(tx.to_address) ?? 0) + val);
    }

    const sorted = [...balances.entries()].sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((s, [, v]) => s + v, 0);

    if (total === 0) continue;

    const top10Count = Math.max(1, Math.ceil(sorted.length * 0.1));
    const top10Sum = sorted.slice(0, top10Count).reduce((s, [, v]) => s + v, 0);
    const top10Pct = (top10Sum / total) * 100;

    if (top10Pct > top10Threshold) {
      await createAlertIfNew(db, rule, target.subject,
        `High concentration: Top 10% hold ${top10Pct.toFixed(1)}%`,
        `Token ${target.subject.slice(0, 10)}... shows high concentration — top 10% of recent recipients hold ${top10Pct.toFixed(1)}% of observed supply (threshold: ${top10Threshold}%).`,
        { top10Pct, top10Threshold, holdersSampled: sorted.length, estimated: true },
        result
      );
    }
  }
}

async function evaluateLoopSuspicion(
  db: ReturnType<typeof createClient>,
  apiKey: string,
  rule: AlertRule,
  tokens: Watchlist[],
  result: ScanResult
): Promise<void> {
  const targets = rule.subject
    ? [{ subject: rule.subject, chain: rule.chain }]
    : tokens.filter((w) => w.chain === rule.chain);

  for (const target of targets.slice(0, 5)) {
    const chainHex = CHAIN_MAP[target.chain] ?? CHAIN_MAP.cronos;

    const data = await fetchMoralis(apiKey, `/erc20/${target.subject}/transfers`, {
      chain: chainHex,
      limit: "100",
      order: "DESC",
    }) as { result?: Array<{ from_address: string; to_address: string; value: string; transaction_hash: string }> };

    if (!data.result?.length) continue;

    // Simple loop detection: A->B and B->A
    const edges = new Map<string, number>();
    for (const tx of data.result) {
      const key = `${tx.from_address}:${tx.to_address}`;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }

    const loops: string[][] = [];
    for (const [key] of edges) {
      const [from, to] = key.split(":");
      const reverseKey = `${to}:${from}`;
      if (edges.has(reverseKey) && from < to) {
        loops.push([from, to]);
      }
    }

    if (loops.length > 0) {
      await createAlertIfNew(db, rule, target.subject,
        `Loop suspicion: ${loops.length} bidirectional transfer pair(s)`,
        `Token ${target.subject.slice(0, 10)}... has ${loops.length} address pair(s) with bidirectional transfers, which may indicate wash trading or coordinated activity.`,
        { loopPairs: loops.slice(0, 5), totalTransfersAnalyzed: data.result.length },
        result
      );
    }
  }
}
