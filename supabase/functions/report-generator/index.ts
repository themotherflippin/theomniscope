import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getSupabase() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

// ---------- Risk Engine (server-side mirror) ----------

interface RiskFactor {
  id: string;
  label: string;
  triggered: boolean;
  weight: number;
  description: string;
}

function computeRiskForReport(items: Array<Record<string, unknown>>): {
  score: number;
  level: string;
  confidence: string;
  factors: RiskFactor[];
} {
  const factors: RiskFactor[] = [];
  const txs = items.filter(i => i.item_type === "tx");
  const wallets = items.filter(i => i.item_type === "wallet");
  const clusters = items.filter(i => i.item_type === "cluster");

  // Large transfer
  const hasLarge = txs.some(i => Number((i.data as Record<string, unknown>)?.value_native ?? 0) > 10000);
  factors.push({ id: "large_transfer", label: "Large Abnormal Transfer", triggered: hasLarge, weight: 15, description: "Transactions exceeding 10,000 native token threshold." });

  // Rapid multi-hop
  const multiHop = wallets.length >= 3 && txs.length >= 5;
  factors.push({ id: "rapid_multi_hop", label: "Rapid Multi-Hop Movement", triggered: multiHop, weight: 20, description: "Multiple wallets and transactions suggest rapid fund movement." });

  // Flagged contract
  const flagged = items.some(i => { const f = (i.data as Record<string, unknown>)?.riskFlags; return Array.isArray(f) && f.length > 0; });
  factors.push({ id: "flagged_contract", label: "Flagged Contract Interaction", triggered: flagged, weight: 25, description: "Interactions with contracts having risk flags." });

  // Suspicious approvals
  const approvals = items.some(i => { const d = i.data as Record<string, unknown>; return d?.method === "approve" || d?.method === "setApprovalForAll"; });
  factors.push({ id: "suspicious_approvals", label: "Suspicious Approval Patterns", triggered: approvals, weight: 18, description: "Token approvals granting unlimited spending access." });

  // Cluster involvement
  factors.push({ id: "cluster_involvement", label: "Cluster Involvement", triggered: clusters.length > 0, weight: 10, description: "Wallet clusters identified suggesting coordinated activity." });

  const triggered = factors.filter(f => f.triggered);
  const score = Math.min(100, triggered.reduce((s, f) => s + f.weight, 0));
  const level = score >= 70 ? "HIGH" : score >= 30 ? "MEDIUM" : "LOW";
  const confidence = items.length >= 10 ? "HIGH" : items.length >= 4 ? "MEDIUM" : "LOW";

  return { score, level, confidence, factors };
}

// ---------- Report content builder ----------

interface ReportData {
  caseData: Record<string, unknown>;
  items: Array<Record<string, unknown>>;
  notes: Array<Record<string, unknown>>;
  timeline: Array<Record<string, unknown>>;
}

function pad(str: string, len: number): string {
  return str.length >= len ? str.slice(0, len) : str + " ".repeat(len - str.length);
}

function buildTextReport(report: ReportData): string {
  const c = report.caseData;
  const risk = computeRiskForReport(report.items);
  const L: string[] = [];
  const W = 60;
  const hr = "═".repeat(W);
  const hr2 = "─".repeat(W);

  L.push("╔" + hr + "╗");
  L.push("║" + pad("  ORACLE INTEL — FORENSIC INVESTIGATION REPORT", W) + "║");
  L.push("╚" + hr + "╝");
  L.push("");
  L.push(`  Generated:  ${new Date().toISOString()}`);
  L.push(`  Platform:   Oracle Intel — On-chain Intelligence`);
  L.push(`  Format:     Forensic Report v3.0`);
  L.push("");

  // ── 1. Executive Summary ──
  L.push("┌" + hr2 + "┐");
  L.push("│  1. EXECUTIVE SUMMARY" + " ".repeat(W - 23) + "│");
  L.push("└" + hr2 + "┘");
  L.push(`  Case Title:    ${c.title}`);
  L.push(`  Case ID:       ${c.id}`);
  L.push(`  Status:        ${String(c.status).toUpperCase()}`);
  L.push(`  Priority:      ${String(c.priority).toUpperCase()}`);
  L.push(`  Chain:         ${c.chain}`);
  L.push(`  Created:       ${new Date(String(c.created_at)).toISOString()}`);
  L.push(`  Last Updated:  ${new Date(String(c.updated_at)).toISOString()}`);
  if (c.description) L.push(`  Description:   ${c.description}`);
  if (Array.isArray(c.tags) && c.tags.length > 0) L.push(`  Tags:          ${c.tags.join(", ")}`);
  L.push("");
  L.push(`  RISK SCORE:    ${risk.score}/100`);
  L.push(`  RISK LEVEL:    ${risk.level}`);
  L.push(`  CONFIDENCE:    ${risk.confidence}`);
  L.push("");

  const wallets = report.items.filter(i => i.item_type === "wallet");
  const tokens = report.items.filter(i => i.item_type === "token");
  const txs = report.items.filter(i => i.item_type === "tx");
  const alerts = report.items.filter(i => i.item_type === "alert");
  const clusters = report.items.filter(i => i.item_type === "cluster");

  L.push(`  Evidence:      ${report.items.length} items total`);
  if (wallets.length) L.push(`    ▸ ${wallets.length} wallet address(es)`);
  if (tokens.length)  L.push(`    ▸ ${tokens.length} token contract(s)`);
  if (txs.length)     L.push(`    ▸ ${txs.length} transaction(s)`);
  if (alerts.length)  L.push(`    ▸ ${alerts.length} alert(s)`);
  if (clusters.length) L.push(`    ▸ ${clusters.length} cluster(s)`);
  L.push(`  Notes:         ${report.notes.length}`);
  L.push(`  Timeline:      ${report.timeline.length} events`);
  L.push("");

  // ── 2. Risk Assessment ──
  L.push("┌" + hr2 + "┐");
  L.push("│  2. RISK ASSESSMENT" + " ".repeat(W - 21) + "│");
  L.push("└" + hr2 + "┘");
  L.push("");

  const triggered = risk.factors.filter(f => f.triggered);
  if (triggered.length === 0) {
    L.push("  No risk factors triggered from available evidence.");
  } else {
    for (const f of triggered) {
      L.push(`  ⚠ [WEIGHT: ${f.weight}] ${f.label}`);
      L.push(`    ${f.description}`);
      L.push("");
    }
  }

  // Non-triggered factors
  const notTriggered = risk.factors.filter(f => !f.triggered);
  if (notTriggered.length > 0) {
    L.push("  Checked but not triggered:");
    for (const f of notTriggered) {
      L.push(`    ✓ ${f.label}`);
    }
  }
  L.push("");

  // ── 3. Evidence Table ──
  const sections = [
    { title: "WALLET EVIDENCE", items: wallets, prefix: "Address" },
    { title: "TOKEN EVIDENCE", items: tokens, prefix: "Contract" },
    { title: "TRANSACTION EVIDENCE", items: txs, prefix: "Hash" },
    { title: "ALERT EVIDENCE", items: alerts, prefix: "Alert" },
    { title: "CLUSTER ANALYSIS", items: clusters, prefix: "Cluster ID" },
  ];

  L.push("┌" + hr2 + "┐");
  L.push("│  3. EVIDENCE DETAILS" + " ".repeat(W - 22) + "│");
  L.push("└" + hr2 + "┘");

  for (const section of sections) {
    if (section.items.length === 0) continue;
    L.push("");
    L.push(`  ── ${section.title} (${section.items.length}) ──`);

    for (const item of section.items) {
      L.push(`  ${section.prefix}: ${item.ref}`);
      if (item.title) L.push(`  Label:   ${item.title}`);
      const data = (item.data ?? {}) as Record<string, unknown>;
      for (const [key, val] of Object.entries(data)) {
        if (val === null || val === undefined) continue;
        const formatted = typeof val === "object" ? JSON.stringify(val) : String(val);
        L.push(`  ${key}: ${formatted}`);
      }
      L.push("");
    }
  }

  // ── 4. Investigator Notes ──
  if (report.notes.length) {
    L.push("┌" + hr2 + "┐");
    L.push("│  4. INVESTIGATOR NOTES" + " ".repeat(W - 24) + "│");
    L.push("└" + hr2 + "┘");
    for (const n of report.notes) {
      L.push(`  ┌ ${new Date(String(n.created_at)).toISOString()}`);
      for (const line of String(n.body).split("\n")) {
        L.push(`  │ ${line}`);
      }
      L.push(`  └${"─".repeat(40)}`);
      L.push("");
    }
  }

  // ── 5. Timeline ──
  if (report.timeline.length) {
    L.push("┌" + hr2 + "┐");
    L.push("│  5. EVENT TIMELINE" + " ".repeat(W - 20) + "│");
    L.push("└" + hr2 + "┘");
    for (const t of report.timeline) {
      const ts = new Date(String(t.time)).toISOString();
      const type = String(t.type).toUpperCase().padEnd(14);
      L.push(`  ${ts}  │ ${type} │ ${t.title}`);
      if (t.details) L.push(`  ${" ".repeat(26)}│ ${" ".repeat(15)}│ ${t.details}`);
    }
    L.push("");
  }

  // ── 6. Methodology ──
  L.push("┌" + hr2 + "┐");
  L.push("│  6. METHODOLOGY & DATA SOURCES" + " ".repeat(W - 32) + "│");
  L.push("└" + hr2 + "┘");
  L.push("  Data Sources:");
  L.push("    • On-chain transaction data (EVM-compatible chains)");
  L.push("    • CoinMarketCap (market data, pricing)");
  L.push("    • DexScreener (DEX trading data)");
  L.push("    • Moralis (wallet activity, token transfers)");
  L.push("  Risk Analysis:");
  L.push("    • Modular risk factor engine (7 heuristics)");
  L.push("    • Weighted scoring: sum of triggered factor weights, capped at 100");
  L.push("    • Confidence based on evidence volume (Low <4, Medium 4-9, High ≥10)");
  L.push("  Cluster Detection:");
  L.push("    • Shared funding patterns, temporal correlation, interaction strength");
  L.push("");

  // ── 7. Data Provenance ──
  L.push("┌" + hr2 + "┐");
  L.push("│  7. DATA PROVENANCE" + " ".repeat(W - 21) + "│");
  L.push("└" + hr2 + "┘");
  L.push(`  Report generated:   ${new Date().toISOString()}`);
  L.push(`  Chain analyzed:     ${c.chain}`);
  L.push(`  Case ID:            ${c.id}`);
  L.push(`  Evidence items:     ${report.items.length}`);
  L.push(`  Risk engine:        v3.0 (modular factors)`);
  L.push(`  Data freshness:     As of evidence collection timestamps`);
  L.push("");

  // ── Disclaimer ──
  L.push("╔" + hr + "╗");
  L.push("║  DISCLAIMER" + " ".repeat(W - 13) + "║");
  L.push("╠" + hr + "╣");
  L.push("║  This report contains on-chain intelligence signals and     ║");
  L.push("║  probabilistic risk indicators based on publicly available  ║");
  L.push("║  blockchain data. Risk flags represent statistical          ║");
  L.push("║  patterns, NOT definitive conclusions.                      ║");
  L.push("║                                                             ║");
  L.push("║  This is NOT financial or legal advice.                     ║");
  L.push("╚" + hr + "╝");

  return L.join("\n");
}

function buildJsonExport(report: ReportData): Record<string, unknown> {
  const risk = computeRiskForReport(report.items);
  return {
    version: "3.0",
    generated_at: new Date().toISOString(),
    platform: "Oracle Intel",
    case: report.caseData,
    risk_assessment: {
      score: risk.score,
      level: risk.level,
      confidence: risk.confidence,
      triggered_factors: risk.factors.filter(f => f.triggered),
      all_factors: risk.factors,
    },
    summary: {
      total_evidence: report.items.length,
      total_notes: report.notes.length,
      wallets_count: report.items.filter(i => i.item_type === "wallet").length,
      tokens_count: report.items.filter(i => i.item_type === "token").length,
      transactions_count: report.items.filter(i => i.item_type === "tx").length,
    },
    evidence: report.items,
    notes: report.notes,
    timeline: report.timeline,
    data_provenance: {
      sources: ["on-chain", "CoinMarketCap", "DexScreener", "Moralis"],
      risk_engine_version: "3.0",
      chain: report.caseData.chain,
    },
    disclaimer: "This report contains on-chain intelligence signals and probabilistic risk indicators based on publicly available blockchain data. This is not financial or legal advice.",
  };
}

// ---------- Main handler ----------

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = getSupabase();
    const body = await req.json();
    const { action, device_id } = body;

    // Device-based authorization
    if (!device_id || typeof device_id !== "string") return json({ error: "device_id required" }, 401);
    const { data: userData } = await supabase.from("user_access").select("id").eq("device_id", device_id).limit(1);
    if (!userData || userData.length === 0) return json({ error: "Unauthorized" }, 403);

    if (action === "generate") {
      const { case_id } = body;
      if (!case_id) return json({ error: "case_id required" }, 400);

      const { data: job, error: jobErr } = await supabase
        .from("report_jobs")
        .insert({ case_id, status: "running" })
        .select()
        .single();
      if (jobErr || !job) throw new Error(jobErr?.message ?? "Failed to create job");

      const [caseRes, itemsRes, notesRes] = await Promise.all([
        supabase.from("cases").select("*").eq("id", case_id).single(),
        supabase.from("case_items").select("*").eq("case_id", case_id).order("created_at"),
        supabase.from("case_notes").select("*").eq("case_id", case_id).order("created_at"),
      ]);

      if (!caseRes.data) {
        await supabase.from("report_jobs").update({ status: "failed", error_message: "Case not found" }).eq("id", job.id);
        return json({ error: "Case not found" }, 404);
      }

      const timeline: Array<Record<string, unknown>> = [];
      timeline.push({ time: caseRes.data.created_at, type: "case_created", title: "Case opened", details: caseRes.data.title });
      for (const item of itemsRes.data ?? []) {
        timeline.push({ time: item.created_at, type: item.item_type, title: `Evidence: ${item.item_type}`, details: item.title ?? item.ref });
      }
      for (const note of notesRes.data ?? []) {
        timeline.push({ time: note.created_at, type: "note", title: "Note added", details: String(note.body).slice(0, 200) });
      }
      timeline.sort((a, b) => new Date(String(a.time)).getTime() - new Date(String(b.time)).getTime());

      const reportData: ReportData = { caseData: caseRes.data, items: itemsRes.data ?? [], notes: notesRes.data ?? [], timeline };

      const textContent = buildTextReport(reportData);
      const jsonContent = JSON.stringify(buildJsonExport(reportData), null, 2);

      const timestamp = Date.now();
      const txtPath = `case-${case_id}/report-${timestamp}.txt`;
      const jsonPath = `case-${case_id}/report-${timestamp}.json`;

      const [txtUpload, jsonUpload] = await Promise.all([
        supabase.storage.from("reports").upload(txtPath, new Blob([textContent], { type: "text/plain" }), { contentType: "text/plain", upsert: true }),
        supabase.storage.from("reports").upload(jsonPath, new Blob([jsonContent], { type: "application/json" }), { contentType: "application/json", upsert: true }),
      ]);

      if (txtUpload.error || jsonUpload.error) {
        const errMsg = txtUpload.error?.message ?? jsonUpload.error?.message ?? "Upload failed";
        await supabase.from("report_jobs").update({ status: "failed", error_message: errMsg }).eq("id", job.id);
        return json({ error: errMsg }, 500);
      }

      // Use signed URLs instead of public URLs
      const { data: txtSignedUrl, error: txtSignErr } = await supabase.storage.from("reports").createSignedUrl(txtPath, 3600);
      const { data: jsonSignedUrl, error: jsonSignErr } = await supabase.storage.from("reports").createSignedUrl(jsonPath, 3600);

      const txtFinalUrl = txtSignedUrl?.signedUrl || txtPath;
      const jsonFinalUrl = jsonSignedUrl?.signedUrl || jsonPath;

      await supabase.from("report_jobs").update({ status: "done", output_url: txtFinalUrl, output_json_url: jsonFinalUrl }).eq("id", job.id);

      return json({ job_id: job.id, status: "done", output_url: txtFinalUrl, output_json_url: jsonFinalUrl });
    }

    if (action === "get_status") {
      const { job_id } = body;
      if (!job_id) return json({ error: "job_id required" }, 400);
      const { data, error: e } = await supabase.from("report_jobs").select("*").eq("id", job_id).single();
      if (e) return json({ error: "Job not found" }, 404);
      return json(data);
    }

    if (action === "list_jobs") {
      const { case_id } = body;
      if (!case_id) return json({ error: "case_id required" }, 400);
      const { data } = await supabase.from("report_jobs").select("*").eq("case_id", case_id).order("created_at", { ascending: false });
      return json(data ?? []);
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal error";
    return json({ error: message }, 500);
  }
});
