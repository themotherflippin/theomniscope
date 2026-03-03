import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Copy, Check, Trash2,
  Activity, Shield,
  Loader2, RefreshCw, Zap, Database, Server,
  CreditCard, BarChart3, ChevronLeft, Clock,
  DollarSign, TrendingUp, Users, Wallet,
} from "lucide-react";
import { useNavigate, Navigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const spring = { type: "spring" as const, stiffness: 500, damping: 30 };

type ServiceStatus = "healthy" | "error" | "not_configured" | "loading";
type CodeDuration = "1week" | "1month" | "3months" | "1year" | "lifetime";

interface HealthData {
  database: { status: string; latencyMs: number; stats: Record<string, number | string | null> };
  moralis: { status: string; latencyMs?: number };
  cmc: { status: string; latencyMs?: number };
  stripe: { status: string; latencyMs?: number };
  edgeFunctions: { status: string };
  storage: { status: string; buckets?: string[] };
  accounting?: {
    freeUsers: number;
    paidUsers: number;
    nftUsers: number;
    totalSales: number;
    croSales: number;
    stripeSales: number;
    totalRevenueCRO: number;
    totalRevenueUSD: number;
    dailyRevenue: { date: string; cro: number; usd: number; sales: number }[];
    error?: string;
  };
}

const DURATION_DAYS: Record<CodeDuration, number | null> = {
  "1week": 7,
  "1month": 30,
  "3months": 90,
  "1year": 365,
  "lifetime": null,
};

function StatusDot({ status }: { status: ServiceStatus }) {
  const colors: Record<ServiceStatus, string> = {
    healthy: "bg-[hsl(var(--success))]",
    error: "bg-[hsl(var(--danger))]",
    not_configured: "bg-[hsl(var(--warning))]",
    loading: "bg-muted-foreground animate-pulse",
  };
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${colors[status]}`} />;
}

function MetricCard({ icon: Icon, label, value, color, status = "healthy" as ServiceStatus, suffix, onClick }: {
  icon: React.ElementType; label: string; value: string; color: string; status?: ServiceStatus; suffix?: string; onClick?: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={spring}
      onClick={onClick}
      className="rounded-xl p-2.5 border border-border/30 text-left w-full"
      style={{ background: `hsl(${color} / 0.08)` }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5" style={{ color: `hsl(${color})` }} />
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-mono font-bold">{value}</span>
        {suffix && <span className="text-[9px] text-muted-foreground">{suffix}</span>}
        <StatusDot status={status} />
      </div>
    </motion.button>
  );
}

function ServiceRow({ name, status, latency }: { name: string; status: ServiceStatus; latency?: number }) {
  const statusLabel: Record<ServiceStatus, string> = {
    healthy: "OK", error: "Down", not_configured: "N/A", loading: "...",
  };
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[11px] text-muted-foreground">{name}</span>
      <div className="flex items-center gap-1.5">
        {latency !== undefined && status === "healthy" && (
          <span className="text-[8px] font-mono text-muted-foreground">{latency}ms</span>
        )}
        <StatusDot status={status} />
        <span className="text-[9px] text-muted-foreground">{statusLabel[status]}</span>
      </div>
    </div>
  );
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getCodeStatus(code: any): "available" | "used" | "expired" {
  if (!code.is_used) {
    if (code.expires_at && new Date(code.expires_at) < new Date()) return "expired";
    return "available";
  }
  if (code.expires_at && new Date(code.expires_at) < new Date()) return "expired";
  return "used";
}

function getDurationLabel(duration: string, t: (key: any) => string): string {
  const map: Record<string, string> = {
    "1week": t("admin.1week"),
    "1month": t("admin.1month"),
    "3months": t("admin.3months"),
    "1year": t("admin.1year"),
    "lifetime": t("admin.lifetime"),
  };
  return map[duration] ?? duration;
}

const CODES_PER_PAGE = 8;

export default function Admin() {
  const { isAdmin, loading: adminLoading } = useAdminStatus();
  const [codes, setCodes] = useState<any[]>([]);
  const [genLoading, setGenLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [scannerRunning, setScannerRunning] = useState(false);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [selectedDuration, setSelectedDuration] = useState<CodeDuration>("lifetime");
  const [codePage, setCodePage] = useState(0); // kept for compat
  const [adminChecked, setAdminChecked] = useState(false);
  const navigate = useNavigate();
  const { t, lang } = useI18n();

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const { data } = await supabase.functions.invoke("admin-health");
      if (data) setHealth(data as HealthData);
    } catch {}
    setHealthLoading(false);
  }, []);

  const fetchCodes = useCallback(async () => {
    const { data } = await supabase
      .from("invitation_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setCodes(data);
  }, []);

  useEffect(() => {
    if (isAdmin && !adminChecked) {
      setAdminChecked(true);
      fetchCodes();
      fetchHealth();
    }
  }, [isAdmin, adminChecked, fetchCodes, fetchHealth]);

  // Loading state while checking admin
  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Non-admin users get redirected
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const createCode = async () => {
    setGenLoading(true);
    const days = DURATION_DAYS[selectedDuration];
    const expiresAt = days
      ? new Date(Date.now() + days * 86400000).toISOString()
      : null;
    await supabase.from("invitation_codes").insert({
      code: generateCode(),
      duration: selectedDuration,
      expires_at: expiresAt,
    } as any);
    await fetchCodes();
    setGenLoading(false);
  };

  const deleteCode = async (id: string) => {
    await supabase.from("invitation_codes").delete().eq("id", id);
    await fetchCodes();
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const runScanner = async () => {
    setScannerRunning(true);
    try { await supabase.functions.invoke("alert-scanner", { body: {} }); } catch {}
    setScannerRunning(false);
    fetchHealth();
  };


  // --- Derived values ---
  const dbStatus = (health?.database?.status ?? "loading") as ServiceStatus;
  const dbLatency = health?.database?.latencyMs;
  const moralisStatus = (health?.moralis?.status ?? "loading") as ServiceStatus;
  const cmcStatus = (health?.cmc?.status ?? "loading") as ServiceStatus;
  const stripeStatus = (health?.stripe?.status ?? "loading") as ServiceStatus;
  const storageStatus = (health?.storage?.status ?? "loading") as ServiceStatus;
  const efStatus = (health?.edgeFunctions?.status ?? "loading") as ServiceStatus;

  const stats = health?.database?.stats;
  const totalAlerts = stats?.alerts ?? "–";
  const activeRules = stats?.activeRules ?? "–";
  const walletScans = stats?.walletScans ?? "–";
  const lastAlert = formatTimeAgo(stats?.lastAlert as string | null);

  const usedCodes = codes.filter(c => c.is_used).length;
  const freeCodes = codes.filter(c => !c.is_used).length;

  // Paginated codes
  const totalPages = Math.max(1, Math.ceil(codes.length / CODES_PER_PAGE));
  const pagedCodes = codes.slice(codePage * CODES_PER_PAGE, (codePage + 1) * CODES_PER_PAGE);

  return (
    <div
      className="h-[100dvh] bg-background flex flex-col overflow-hidden"
      style={{ paddingTop: "max(env(safe-area-inset-top, 12px), 12px)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/profile")}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-display font-bold tracking-tight">{t("admin.title")}</h1>
          {healthLoading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchHealth} disabled={healthLoading}>
          <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 px-3 pb-3 flex flex-col gap-2.5 min-h-0 overflow-y-auto scrollbar-hide">

        {/* Row 1: Live Metrics — clickable */}
        <div className="grid grid-cols-4 gap-2 shrink-0">
          <MetricCard
            icon={Database}
            label="DB"
            value={dbLatency !== undefined ? `${dbLatency}` : "–"}
            suffix="ms"
            color="var(--chart-cyan)"
            status={dbStatus}
          />
          <MetricCard
            icon={Activity}
            label="Alerts"
            value={String(totalAlerts)}
            color="var(--warning)"
            onClick={() => navigate("/server-alerts")}
          />
          <MetricCard
            icon={Zap}
            label="Rules"
            value={String(activeRules)}
            suffix="active"
            color="var(--success)"
            status={dbStatus}
            onClick={() => navigate("/alert-rules")}
          />
          <MetricCard
            icon={BarChart3}
            label="Scans"
            value={String(walletScans)}
            color="var(--chart-blue)"
            status={dbStatus}
          />
        </div>

        {/* Row 2: Services + Actions — equal height columns */}
        <div className="grid grid-cols-2 gap-2 shrink-0">
          {/* Left column: Services (stretched) */}
          <div className="rounded-xl border border-border/30 p-2.5 flex flex-col" style={{ background: "hsl(var(--widget-market) / 0.5)" }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Server className="w-3 h-3 text-[hsl(var(--chart-blue))]" />
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">{t("admin.services")}</span>
            </div>
            <ServiceRow name="Moralis API" status={moralisStatus} latency={health?.moralis?.latencyMs} />
            <ServiceRow name="CoinMarketCap" status={cmcStatus} latency={health?.cmc?.latencyMs} />
            <ServiceRow name="Stripe" status={stripeStatus} latency={health?.stripe?.latencyMs} />
            <ServiceRow name="Database" status={dbStatus} latency={dbLatency} />
            <ServiceRow name="Edge Functions" status={efStatus} />
            <ServiceRow name="Storage" status={storageStatus} />

            {/* Uptime summary — fills remaining space */}
            <div className="mt-auto pt-2 border-t border-border/20">
              <div className="flex items-center gap-1 mb-1">
                <Activity className="w-2.5 h-2.5 text-[hsl(var(--success))]" />
                <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-medium">System Health</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">Services Up</span>
                <span className="text-[10px] font-mono font-bold text-[hsl(var(--success))]">
                  {health ? [moralisStatus, cmcStatus, stripeStatus, dbStatus, efStatus, storageStatus].filter(s => s === "healthy").length : "–"}/6
                </span>
              </div>
              <div className="w-full h-1 rounded-full bg-muted/30 overflow-hidden mt-1">
                <div
                  className="h-full rounded-full bg-[hsl(var(--success))]"
                  style={{ width: health ? `${([moralisStatus, cmcStatus, stripeStatus, dbStatus, efStatus, storageStatus].filter(s => s === "healthy").length / 6) * 100}%` : "0%" }}
                />
              </div>
            </div>
          </div>

          {/* Right column: Actions + Voucher Stats */}
          <div className="flex flex-col gap-2">
            {/* Actions */}
            <div className="rounded-xl border border-border/30 p-2.5 flex flex-col gap-1.5" style={{ background: "hsl(var(--widget-actions) / 0.5)" }}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Zap className="w-3 h-3 text-[hsl(var(--chart-cyan))]" />
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">{t("admin.actions")}</span>
              </div>
              <Button size="sm" variant="outline" className="w-full text-[10px] h-7 gap-1" onClick={runScanner} disabled={scannerRunning}>
                {scannerRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                {t("admin.runScanner")}
              </Button>
              <Select value={selectedDuration} onValueChange={(v) => setSelectedDuration(v as CodeDuration)}>
                <SelectTrigger className="h-7 text-[10px]">
                  <Clock className="w-3 h-3 mr-1 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1week">{t("admin.1week")}</SelectItem>
                  <SelectItem value="1month">{t("admin.1month")}</SelectItem>
                  <SelectItem value="3months">{t("admin.3months")}</SelectItem>
                  <SelectItem value="1year">{t("admin.1year")}</SelectItem>
                  <SelectItem value="lifetime">{t("admin.lifetime")}</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" className="w-full text-[10px] h-7 gap-1" onClick={createCode} disabled={genLoading}>
                {genLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                {t("admin.generate")}
              </Button>
            </div>

            {/* Voucher Stats — fills remaining space */}
            <div className="rounded-xl border border-border/30 p-2.5 flex-1 flex flex-col justify-center" style={{ background: "hsl(var(--widget-alerts) / 0.3)" }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <CreditCard className="w-3 h-3 text-[hsl(var(--warning))]" />
                <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-medium">Voucher Stats</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-center">
                <div className="flex-1">
                  <p className="text-sm font-bold font-mono">{freeCodes}</p>
                  <p className="text-[7px] text-muted-foreground uppercase">{t("admin.available")}</p>
                </div>
                <div className="w-px h-5 bg-border/40" />
                <div className="flex-1">
                  <p className="text-sm font-bold font-mono">{usedCodes}</p>
                  <p className="text-[7px] text-muted-foreground uppercase">{t("admin.used")}</p>
                </div>
                <div className="w-px h-5 bg-border/40" />
                <div className="flex-1">
                  <p className="text-[9px] font-mono text-muted-foreground">{lastAlert}</p>
                  <p className="text-[7px] text-muted-foreground uppercase">{t("admin.lastAlert")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Invitation Codes — horizontal carousel */}
        <div
          className="rounded-xl border border-border/30 p-2.5 shrink-0"
          style={{ background: "hsl(var(--widget-alerts) / 0.4)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-[hsl(var(--warning))]" />
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">{t("admin.accessCodes")}</span>
            </div>
            <span className="text-[9px] text-muted-foreground font-mono">{codes.length} total</span>
          </div>

          {codes.length === 0 ? (
            <p className="text-center text-[11px] text-muted-foreground py-4">{t("admin.noCodes")}</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1 snap-x snap-mandatory">
              {codes.map((c) => {
                const status = getCodeStatus(c);
                const statusColor = status === "used"
                  ? "bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] border-[hsl(var(--success)/0.2)]"
                  : status === "expired"
                  ? "bg-[hsl(var(--danger)/0.1)] text-[hsl(var(--danger))] border-[hsl(var(--danger)/0.2)]"
                  : "bg-muted text-muted-foreground border-border/30";

                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={spring}
                    className="flex flex-col gap-1 px-2.5 py-2 rounded-lg border border-border/20 bg-card/60 backdrop-blur-sm min-w-[140px] shrink-0 snap-start"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold tracking-widest">{c.code}</span>
                      <div className="flex items-center gap-0.5">
                        <button className="p-0.5 rounded hover:bg-accent/50 transition-colors" onClick={() => copyCode(c.code, c.id)}>
                          {copiedId === c.id
                            ? <Check className="w-2.5 h-2.5 text-[hsl(var(--success))]" />
                            : <Copy className="w-2.5 h-2.5 text-muted-foreground" />}
                        </button>
                        <button className="p-0.5 rounded hover:bg-destructive/10 transition-colors" onClick={() => deleteCode(c.id)}>
                          <Trash2 className="w-2.5 h-2.5 text-destructive/70" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge className={`text-[7px] px-1 py-0 h-3.5 ${statusColor}`}>
                        {status === "used" ? t("admin.used") : status === "expired" ? t("admin.expired") : t("admin.available")}
                      </Badge>
                      <span className="text-[7px] text-muted-foreground font-mono">
                        {getDurationLabel((c as any).duration ?? "lifetime", t)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Row 4: Usage Analytics */}
        <div
          className="rounded-xl border border-border/30 p-2.5 shrink-0"
          style={{ background: "hsl(var(--chart-blue) / 0.06)" }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <BarChart3 className="w-3 h-3 text-[hsl(var(--chart-blue))]" />
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">User Activity</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-border/20 bg-card/40 p-2 text-center">
              <p className="text-lg font-bold font-mono">{usedCodes}</p>
              <p className="text-[8px] text-muted-foreground uppercase">Active Users</p>
            </div>
            <div className="rounded-lg border border-border/20 bg-card/40 p-2 text-center">
              <p className="text-lg font-bold font-mono">{String(walletScans)}</p>
              <p className="text-[8px] text-muted-foreground uppercase">Total Scans</p>
            </div>
            <div className="rounded-lg border border-border/20 bg-card/40 p-2 text-center">
              <p className="text-lg font-bold font-mono">{String(totalAlerts)}</p>
              <p className="text-[8px] text-muted-foreground uppercase">Alerts Created</p>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-border/20 bg-card/40 p-2">
              <div className="flex items-center gap-1 mb-1">
                <CreditCard className="w-3 h-3 text-[hsl(var(--warning))]" />
                <span className="text-[8px] text-muted-foreground uppercase font-medium">Codes by Type</span>
              </div>
              <div className="space-y-0.5">
                {['lifetime', '1year', '3months', '1month', '1week'].map(d => {
                  const count = codes.filter(c => (c.duration ?? 'lifetime') === d).length;
                  if (count === 0) return null;
                  return (
                    <div key={d} className="flex items-center justify-between">
                      <span className="text-[9px] text-muted-foreground">{getDurationLabel(d, t)}</span>
                      <span className="text-[10px] font-mono font-bold">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-lg border border-border/20 bg-card/40 p-2">
              <div className="flex items-center gap-1 mb-1">
                <Activity className="w-3 h-3 text-[hsl(var(--success))]" />
                <span className="text-[8px] text-muted-foreground uppercase font-medium">Adoption Rate</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-muted-foreground">Used</span>
                  <span className="text-[10px] font-mono font-bold text-[hsl(var(--success))]">
                    {codes.length > 0 ? Math.round((usedCodes / codes.length) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted/30 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[hsl(var(--success))]"
                    style={{ width: `${codes.length > 0 ? (usedCodes / codes.length) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-muted-foreground">Expired</span>
                  <span className="text-[10px] font-mono font-bold text-[hsl(var(--danger))]">
                    {codes.filter(c => getCodeStatus(c) === 'expired').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 5: Accounting / Revenue */}
        {health?.accounting && !health.accounting.error && (
          <div
            className="rounded-xl border border-border/30 p-2.5 shrink-0"
            style={{ background: "hsl(var(--success) / 0.06)" }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <DollarSign className="w-3 h-3 text-[hsl(var(--success))]" />
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Comptabilité & Revenus</span>
            </div>

            {/* Pass breakdown */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="rounded-lg border border-border/20 bg-card/40 p-2 text-center">
                <Users className="w-3.5 h-3.5 mx-auto mb-0.5 text-muted-foreground" />
                <p className="text-lg font-bold font-mono">{health.accounting.freeUsers}</p>
                <p className="text-[7px] text-muted-foreground uppercase">Pass Gratuit</p>
              </div>
              <div className="rounded-lg border border-border/20 bg-card/40 p-2 text-center">
                <CreditCard className="w-3.5 h-3.5 mx-auto mb-0.5 text-[hsl(var(--success))]" />
                <p className="text-lg font-bold font-mono text-[hsl(var(--success))]">{health.accounting.paidUsers}</p>
                <p className="text-[7px] text-muted-foreground uppercase">Pass Payant</p>
              </div>
              <div className="rounded-lg border border-border/20 bg-card/40 p-2 text-center">
                <Shield className="w-3.5 h-3.5 mx-auto mb-0.5 text-[hsl(var(--chart-cyan))]" />
                <p className="text-lg font-bold font-mono text-[hsl(var(--chart-cyan))]">{health.accounting.nftUsers}</p>
                <p className="text-[7px] text-muted-foreground uppercase">NFT Holders</p>
              </div>
            </div>

            {/* Revenue totals */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="rounded-lg border border-border/20 bg-card/40 p-2">
                <div className="flex items-center gap-1 mb-1">
                  <Wallet className="w-3 h-3 text-[hsl(var(--chart-blue))]" />
                  <span className="text-[8px] text-muted-foreground uppercase font-medium">Ventes CRO</span>
                </div>
                <p className="text-sm font-bold font-mono">{health.accounting.croSales} <span className="text-[9px] text-muted-foreground">ventes</span></p>
                <p className="text-[10px] font-mono text-[hsl(var(--success))]">{health.accounting.totalRevenueCRO.toLocaleString()} CRO</p>
              </div>
              <div className="rounded-lg border border-border/20 bg-card/40 p-2">
                <div className="flex items-center gap-1 mb-1">
                  <CreditCard className="w-3 h-3 text-[hsl(var(--warning))]" />
                  <span className="text-[8px] text-muted-foreground uppercase font-medium">Ventes Stripe</span>
                </div>
                <p className="text-sm font-bold font-mono">{health.accounting.stripeSales} <span className="text-[9px] text-muted-foreground">ventes</span></p>
                <p className="text-[10px] font-mono text-[hsl(var(--success))]">${health.accounting.totalRevenueUSD.toFixed(2)}</p>
              </div>
            </div>

            {/* Daily revenue chart (last 7 days) */}
            <div className="rounded-lg border border-border/20 bg-card/40 p-2">
              <div className="flex items-center gap-1 mb-2">
                <TrendingUp className="w-3 h-3 text-[hsl(var(--success))]" />
                <span className="text-[8px] text-muted-foreground uppercase font-medium">Évolution 7 jours</span>
                <span className="ml-auto text-[8px] font-mono text-muted-foreground">
                  Total: {health.accounting.totalSales} ventes
                </span>
              </div>
              <div className="flex items-end gap-1 h-16">
                {health.accounting.dailyRevenue.map((day) => {
                  const maxSales = Math.max(...health.accounting!.dailyRevenue.map(d => d.sales), 1);
                  const height = day.sales > 0 ? Math.max((day.sales / maxSales) * 100, 10) : 4;
                  const dayLabel = new Date(day.date).toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 2);
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className="w-full flex flex-col items-center justify-end" style={{ height: "48px" }}>
                        {day.sales > 0 && (
                          <span className="text-[7px] font-mono font-bold mb-0.5">{day.sales}</span>
                        )}
                        <div
                          className="w-full rounded-sm bg-[hsl(var(--success))]"
                          style={{ height: `${height}%`, minHeight: "2px", opacity: day.sales > 0 ? 1 : 0.2 }}
                        />
                      </div>
                      <span className="text-[7px] text-muted-foreground">{dayLabel}</span>
                      {day.usd > 0 && <span className="text-[6px] font-mono text-[hsl(var(--warning))]">${day.usd.toFixed(0)}</span>}
                      {day.cro > 0 && <span className="text-[6px] font-mono text-[hsl(var(--chart-blue))]">{day.cro}₡</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
