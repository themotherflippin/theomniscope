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

// ---------- Report content builder ----------

interface ReportData {
  caseData: Record<string, unknown>;
  items: Array<Record<string, unknown>>;
  notes: Array<Record<string, unknown>>;
  timeline: Array<Record<string, unknown>>;
}

function buildTextReport(report: ReportData): string {
  const c = report.caseData;
  const lines: string[] = [];

  lines.push("╔" + "═".repeat(58) + "╗");
  lines.push("║" + " ".repeat(12) + "ORACLE INTEL — INVESTIGATION REPORT" + " ".repeat(11) + "║");
  lines.push("╚" + "═".repeat(58) + "╝");
  lines.push("");
  lines.push(`Report Generated: ${new Date().toISOString()}`);
  lines.push(`Platform: Oracle Intel — On-chain Intelligence`);
  lines.push("");

  // ── Case Overview ──
  lines.push("┌" + "─".repeat(58) + "┐");
  lines.push("│  CASE OVERVIEW" + " ".repeat(43) + "│");
  lines.push("└" + "─".repeat(58) + "┘");
  lines.push(`  Title:       ${c.title}`);
  lines.push(`  Case ID:     ${c.id}`);
  lines.push(`  Status:      ${String(c.status).toUpperCase()}`);
  lines.push(`  Priority:    ${String(c.priority).toUpperCase()}`);
  lines.push(`  Chain:       ${c.chain}`);
  lines.push(`  Created:     ${new Date(String(c.created_at)).toLocaleString()}`);
  lines.push(`  Last Update: ${new Date(String(c.updated_at)).toLocaleString()}`);
  if (c.description) lines.push(`  Description: ${c.description}`);
  if (Array.isArray(c.tags) && c.tags.length > 0) lines.push(`  Tags:        ${c.tags.join(", ")}`);
  lines.push("");

  // ── Executive Summary ──
  lines.push("┌" + "─".repeat(58) + "┐");
  lines.push("│  EXECUTIVE SUMMARY" + " ".repeat(39) + "│");
  lines.push("└" + "─".repeat(58) + "┘");

  const wallets = report.items.filter(i => i.item_type === "wallet");
  const tokens = report.items.filter(i => i.item_type === "token");
  const txs = report.items.filter(i => i.item_type === "tx");
  const alerts = report.items.filter(i => i.item_type === "alert");
  const clusters = report.items.filter(i => i.item_type === "cluster");

  lines.push(`  Total evidence items: ${report.items.length}`);
  lines.push(`  Investigator notes:   ${report.notes.length}`);
  lines.push(`  Timeline events:      ${report.timeline.length}`);
  lines.push("");
  if (wallets.length) lines.push(`  ▸ ${wallets.length} wallet address(es)`);
  if (tokens.length) lines.push(`  ▸ ${tokens.length} token contract(s)`);
  if (txs.length) lines.push(`  ▸ ${txs.length} transaction(s)`);
  if (alerts.length) lines.push(`  ▸ ${alerts.length} alert(s)`);
  if (clusters.length) lines.push(`  ▸ ${clusters.length} cluster analysis(es)`);
  lines.push("");

  // ── Risk Assessment ──
  const hasRiskData = report.items.some(i => {
    const data = (i.data ?? {}) as Record<string, unknown>;
    return data.riskFlags || data.riskScore || data.top10Pct;
  });

  if (hasRiskData) {
    lines.push("┌" + "─".repeat(58) + "┐");
    lines.push("│  RISK ASSESSMENT" + " ".repeat(41) + "│");
    lines.push("└" + "─".repeat(58) + "┘");
    for (const item of report.items) {
      const data = (item.data ?? {}) as Record<string, unknown>;
      if (data.riskScore !== undefined || data.riskFlags) {
        lines.push(`  ${item.item_type.toUpperCase()}: ${item.ref}`);
        if (data.riskScore !== undefined) lines.push(`    Risk Score: ${data.riskScore}/100`);
        if (Array.isArray(data.riskFlags)) {
          for (const flag of data.riskFlags as Array<{ label: string; severity: string }>) {
            lines.push(`    ⚠ [${flag.severity?.toUpperCase() ?? "MEDIUM"}] ${flag.label}`);
          }
        }
        lines.push("");
      }
    }
  }

  // ── Evidence Details ──
  const sections: { title: string; items: Array<Record<string, unknown>>; prefix: string }[] = [
    { title: "WALLET EVIDENCE", items: wallets, prefix: "Address" },
    { title: "TOKEN EVIDENCE", items: tokens, prefix: "Contract" },
    { title: "TRANSACTION EVIDENCE", items: txs, prefix: "Hash" },
    { title: "ALERT EVIDENCE", items: alerts, prefix: "Alert" },
    { title: "CLUSTER ANALYSIS", items: clusters, prefix: "Cluster ID" },
  ];

  for (const section of sections) {
    if (section.items.length === 0) continue;

    lines.push("┌" + "─".repeat(58) + "┐");
    lines.push(`│  ${section.title}` + " ".repeat(Math.max(0, 57 - section.title.length)) + "│");
    lines.push("└" + "─".repeat(58) + "┘");

    for (const item of section.items) {
      lines.push(`  ${section.prefix}: ${item.ref}`);
      if (item.title) lines.push(`  Label:   ${item.title}`);

      const data = (item.data ?? {}) as Record<string, unknown>;
      const dataKeys = Object.keys(data).filter(k => data[k] !== null && data[k] !== undefined);
      for (const key of dataKeys) {
        const val = data[key];
        const formatted = typeof val === "object" ? JSON.stringify(val) : String(val);
        lines.push(`  ${key}: ${formatted}`);
      }
      lines.push("");
    }
  }

  // ── Investigator Notes ──
  if (report.notes.length) {
    lines.push("┌" + "─".repeat(58) + "┐");
    lines.push("│  INVESTIGATOR NOTES" + " ".repeat(38) + "│");
    lines.push("└" + "─".repeat(58) + "┘");
    for (const n of report.notes) {
      const date = new Date(String(n.created_at)).toLocaleString();
      lines.push(`  ┌ ${date}`);
      const body = String(n.body);
      // Wrap long notes
      const noteLines = body.split("\n");
      for (const nl of noteLines) {
        lines.push(`  │ ${nl}`);
      }
      lines.push(`  └${"─".repeat(40)}`);
      lines.push("");
    }
  }

  // ── Timeline ──
  if (report.timeline.length) {
    lines.push("┌" + "─".repeat(58) + "┐");
    lines.push("│  TIMELINE" + " ".repeat(48) + "│");
    lines.push("└" + "─".repeat(58) + "┘");
    for (const t of report.timeline) {
      const date = new Date(String(t.time)).toLocaleString();
      const type = String(t.type).toUpperCase().padEnd(12);
      lines.push(`  ${date}  │ ${type} │ ${t.title}`);
      if (t.details) lines.push(`  ${" ".repeat(22)}│ ${" ".repeat(13)}│ ${t.details}`);
    }
    lines.push("");
  }

  // ── Methodology ──
  lines.push("┌" + "─".repeat(58) + "┐");
  lines.push("│  METHODOLOGY & DATA SOURCES" + " ".repeat(30) + "│");
  lines.push("└" + "─".repeat(58) + "┘");
  lines.push("  Data Sources:");
  lines.push("    • On-chain transaction data (EVM-compatible chains)");
  lines.push("    • CoinMarketCap (market data, pricing)");
  lines.push("    • DexScreener (DEX trading data)");
  lines.push("    • Moralis (wallet activity, token transfers)");
  lines.push("  Analysis Methods:");
  lines.push("    • Cluster detection via shared funding patterns");
  lines.push("    • Risk scoring: liquidity, concentration, patterns");
  lines.push("    • Smart money tracking via historical PnL heuristics");
  lines.push("");

  // ── Disclaimer ──
  lines.push("╔" + "═".repeat(58) + "╗");
  lines.push("║  DISCLAIMER" + " ".repeat(46) + "║");
  lines.push("╠" + "═".repeat(58) + "╣");
  lines.push("║  This report contains on-chain intelligence signals    ║");
  lines.push("║  and probabilistic risk indicators. All findings are   ║");
  lines.push("║  based on publicly available blockchain data.          ║");
  lines.push("║                                                        ║");
  lines.push("║  Risk flags represent statistical patterns, NOT        ║");
  lines.push("║  definitive conclusions about illicit activity.        ║");
  lines.push("║                                                        ║");
  lines.push("║  This is NOT financial or legal advice.                ║");
  lines.push("╚" + "═".repeat(58) + "╝");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Oracle Intel Platform — Chain: ${c.chain}`);
  lines.push(`Case ID: ${c.id}`);

  return lines.join("\n");
}

function buildJsonExport(report: ReportData): Record<string, unknown> {
  const wallets = report.items.filter(i => i.item_type === "wallet");
  const tokens = report.items.filter(i => i.item_type === "token");
  const txs = report.items.filter(i => i.item_type === "tx");

  return {
    version: "2.0",
    generated_at: new Date().toISOString(),
    platform: "Oracle Intel",
    case: report.caseData,
    summary: {
      total_evidence: report.items.length,
      total_notes: report.notes.length,
      wallets_count: wallets.length,
      tokens_count: tokens.length,
      transactions_count: txs.length,
      priority: report.caseData.priority,
      status: report.caseData.status,
    },
    evidence: report.items,
    notes: report.notes,
    timeline: report.timeline,
    data_sources: ["on-chain", "CoinMarketCap", "DexScreener", "Moralis"],
    disclaimer: "This report contains on-chain intelligence signals and probabilistic risk indicators based on publicly available blockchain data. This is not financial or legal advice.",
  };
}

// ---------- Main handler ----------

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = getSupabase();
    const body = await req.json();
    const { action } = body;

    if (action === "generate") {
      const { case_id } = body;
      if (!case_id) return json({ error: "case_id required" }, 400);

      // Create job
      const { data: job, error: jobErr } = await supabase
        .from("report_jobs")
        .insert({ case_id, status: "running" })
        .select()
        .single();
      if (jobErr || !job) throw new Error(jobErr?.message ?? "Failed to create job");

      // Fetch all case data
      const [caseRes, itemsRes, notesRes] = await Promise.all([
        supabase.from("cases").select("*").eq("id", case_id).single(),
        supabase.from("case_items").select("*").eq("case_id", case_id).order("created_at"),
        supabase.from("case_notes").select("*").eq("case_id", case_id).order("created_at"),
      ]);

      if (!caseRes.data) {
        await supabase.from("report_jobs").update({ status: "failed", error_message: "Case not found" }).eq("id", job.id);
        return json({ error: "Case not found" }, 404);
      }

      // Build timeline
      const timeline: Array<Record<string, unknown>> = [];
      timeline.push({
        time: caseRes.data.created_at,
        type: "case_created",
        title: "Case opened",
        details: caseRes.data.title,
      });

      for (const item of itemsRes.data ?? []) {
        timeline.push({
          time: item.created_at,
          type: item.item_type,
          title: `Evidence: ${item.item_type}`,
          details: item.title ?? item.ref,
        });
      }

      for (const note of notesRes.data ?? []) {
        timeline.push({
          time: note.created_at,
          type: "note",
          title: "Note added",
          details: String(note.body).slice(0, 200),
        });
      }

      timeline.sort((a, b) => new Date(String(a.time)).getTime() - new Date(String(b.time)).getTime());

      const reportData: ReportData = {
        caseData: caseRes.data,
        items: itemsRes.data ?? [],
        notes: notesRes.data ?? [],
        timeline,
      };

      // Generate text report (as PDF-like text file)
      const textContent = buildTextReport(reportData);
      const jsonContent = JSON.stringify(buildJsonExport(reportData), null, 2);

      // Upload to storage
      const timestamp = Date.now();
      const pdfPath = `case-${case_id}/report-${timestamp}.txt`;
      const jsonPath = `case-${case_id}/report-${timestamp}.json`;

      const [pdfUpload, jsonUpload] = await Promise.all([
        supabase.storage.from("reports").upload(pdfPath, new Blob([textContent], { type: "text/plain" }), {
          contentType: "text/plain",
          upsert: true,
        }),
        supabase.storage.from("reports").upload(jsonPath, new Blob([jsonContent], { type: "application/json" }), {
          contentType: "application/json",
          upsert: true,
        }),
      ]);

      if (pdfUpload.error || jsonUpload.error) {
        const errMsg = pdfUpload.error?.message ?? jsonUpload.error?.message ?? "Upload failed";
        await supabase.from("report_jobs").update({ status: "failed", error_message: errMsg }).eq("id", job.id);
        return json({ error: errMsg }, 500);
      }

      const { data: pdfUrl } = supabase.storage.from("reports").getPublicUrl(pdfPath);
      const { data: jsonUrl } = supabase.storage.from("reports").getPublicUrl(jsonPath);

      await supabase.from("report_jobs").update({
        status: "done",
        output_url: pdfUrl.publicUrl,
        output_json_url: jsonUrl.publicUrl,
      }).eq("id", job.id);

      return json({
        job_id: job.id,
        status: "done",
        output_url: pdfUrl.publicUrl,
        output_json_url: jsonUrl.publicUrl,
      });
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
