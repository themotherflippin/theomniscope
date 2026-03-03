import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import oracleLogo from "@/assets/oracle-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Lock, Plus, Copy, Check, Trash2, ArrowLeft,
  Activity, Clock, Shield, FileText,
  Loader2, RefreshCw, Zap, Database, Server,
  Wifi, WifiOff, CreditCard, BarChart3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const spring = { type: "spring" as const, stiffness: 500, damping: 30 };

type ServiceStatus = "healthy" | "error" | "not_configured" | "loading";

interface HealthData {
  database: { status: string; latencyMs: number; stats: Record<string, number | string | null> };
  moralis: { status: string; latencyMs?: number };
  cmc: { status: string; latencyMs?: number };
  stripe: { status: string; latencyMs?: number };
  edgeFunctions: { status: string };
  storage: { status: string; buckets?: string[] };
}

function StatusDot({ status }: { status: ServiceStatus }) {
  const colors: Record<ServiceStatus, string> = {
    healthy: "bg-[hsl(var(--success))]",
    error: "bg-[hsl(var(--danger))]",
    not_configured: "bg-[hsl(var(--warning))]",
    loading: "bg-muted-foreground animate-pulse",
  };
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${colors[status]}`} />;
}

function MetricCard({ icon: Icon, label, value, color, status = "healthy" as ServiceStatus, suffix }: {
  icon: React.ElementType; label: string; value: string; color: string; status?: ServiceStatus; suffix?: string;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      transition={spring}
      className="rounded-xl p-2.5 border border-border/30"
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
    </motion.div>
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

export default function Admin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [codes, setCodes] = useState<any[]>([]);
  const [genLoading, setGenLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [scannerRunning, setScannerRunning] = useState(false);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useI18n();

  const verifyCredentials = async () => {
    setLoginError("");
    const { data, error } = await supabase.functions.invoke("verify-admin-pin", {
      body: { email: email.trim(), password: password.trim() },
    });
    if (error || !data?.valid) {
      setLoginError(t("admin.loginError"));
      return;
    }
    setAuthenticated(true);
    localStorage.setItem("oracle_admin_session", Date.now().toString());
  };

  useEffect(() => {
    const session = localStorage.getItem("oracle_admin_session");
    if (session && Date.now() - parseInt(session) < 3600000) {
      setAuthenticated(true);
    }
  }, []);

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
    if (authenticated) {
      fetchCodes();
      fetchHealth();
    }
  }, [authenticated, fetchCodes, fetchHealth]);

  const createCode = async () => {
    setGenLoading(true);
    await supabase.from("invitation_codes").insert({ code: generateCode() });
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
    fetchHealth(); // Refresh stats after scan
  };

  // --- Login ---
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={spring}
          className="w-full max-w-xs space-y-5 text-center"
        >
          <img src={oracleLogo} alt="Oracle" className="w-16 h-16 mx-auto object-contain" />
          <h1 className="text-lg font-display font-bold">{t("admin.title")}</h1>
          <div className="space-y-2.5">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="email" placeholder={t("admin.emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" className="pl-10 h-10 text-sm" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="password" placeholder={t("admin.passwordPlaceholder")} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && verifyCredentials()} autoComplete="off" className="pl-10 h-10 text-sm" />
            </div>
            {loginError && <p className="text-xs text-destructive">{loginError}</p>}
            <Button className="w-full h-10" onClick={verifyCredentials} disabled={!email || !password}>
              {t("admin.access")}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- Derived values from real health data ---
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
  const activeWatchlists = stats?.activeWatchlists ?? "–";
  const walletScans = stats?.walletScans ?? "–";
  const lastAlert = formatTimeAgo(stats?.lastAlert as string | null);

  const usedCodes = codes.filter(c => c.is_used).length;
  const freeCodes = codes.filter(c => !c.is_used).length;

  return (
    <div
      className="h-[100dvh] bg-background flex flex-col overflow-hidden"
      style={{ paddingTop: "max(env(safe-area-inset-top, 12px), 12px)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-display font-bold tracking-tight">Administration</h1>
          {healthLoading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchHealth} disabled={healthLoading}>
          <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 px-3 pb-3 flex flex-col gap-2.5 min-h-0">

        {/* Row 1: Live Metrics */}
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
            status={Number(totalAlerts) > 0 ? "healthy" : "healthy"}
          />
          <MetricCard
            icon={Zap}
            label="Rules"
            value={String(activeRules)}
            suffix="active"
            color="var(--success)"
            status={dbStatus}
          />
          <MetricCard
            icon={BarChart3}
            label="Scans"
            value={String(walletScans)}
            color="var(--chart-blue)"
            status={dbStatus}
          />
        </div>

        {/* Row 2: Services + Actions */}
        <div className="grid grid-cols-2 gap-2 shrink-0">
          {/* Live Services */}
          <div className="rounded-xl border border-border/30 p-2.5" style={{ background: "hsl(var(--widget-market) / 0.5)" }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Server className="w-3 h-3 text-[hsl(var(--chart-blue))]" />
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Services</span>
            </div>
            <ServiceRow name="Moralis API" status={moralisStatus} latency={health?.moralis?.latencyMs} />
            <ServiceRow name="CoinMarketCap" status={cmcStatus} latency={health?.cmc?.latencyMs} />
            <ServiceRow name="Stripe" status={stripeStatus} latency={health?.stripe?.latencyMs} />
            <ServiceRow name="Database" status={dbStatus} latency={dbLatency} />
            <ServiceRow name="Edge Functions" status={efStatus} />
            <ServiceRow name="Storage" status={storageStatus} />
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-border/30 p-2.5 flex flex-col gap-1.5" style={{ background: "hsl(var(--widget-actions) / 0.5)" }}>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Zap className="w-3 h-3 text-[hsl(var(--chart-cyan))]" />
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Actions</span>
            </div>
            <Button size="sm" variant="outline" className="w-full text-[10px] h-7 gap-1" onClick={runScanner} disabled={scannerRunning}>
              {scannerRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Run Scanner
            </Button>
            <Button size="sm" variant="outline" className="w-full text-[10px] h-7 gap-1" onClick={createCode} disabled={genLoading}>
              {genLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              {t("admin.generate")}
            </Button>
            <div className="flex items-center justify-between gap-2 mt-auto text-center">
              <div className="flex-1">
                <p className="text-sm font-bold font-mono">{freeCodes}</p>
                <p className="text-[8px] text-muted-foreground uppercase">Available</p>
              </div>
              <div className="w-px h-5 bg-border/40" />
              <div className="flex-1">
                <p className="text-sm font-bold font-mono">{usedCodes}</p>
                <p className="text-[8px] text-muted-foreground uppercase">Used</p>
              </div>
              <div className="w-px h-5 bg-border/40" />
              <div className="flex-1">
                <p className="text-[9px] font-mono text-muted-foreground">{lastAlert}</p>
                <p className="text-[8px] text-muted-foreground uppercase">Last Alert</p>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Invitation Codes */}
        <div
          className="rounded-xl border border-border/30 p-2.5 flex-1 min-h-0 flex flex-col"
          style={{ background: "hsl(var(--widget-alerts) / 0.4)" }}
        >
          <div className="flex items-center justify-between mb-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-[hsl(var(--warning))]" />
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Access Codes</span>
            </div>
            <span className="text-[9px] text-muted-foreground font-mono">{codes.length} total</span>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 space-y-1.5 scrollbar-hide">
            <AnimatePresence initial={false}>
              {codes.length === 0 ? (
                <p className="text-center text-[11px] text-muted-foreground py-4">{t("admin.noCodes")}</p>
              ) : (
                codes.map((c) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={spring}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-border/20 bg-card/60 backdrop-blur-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-xs font-bold tracking-widest">{c.code}</span>
                    </div>
                    <Badge
                      className={`text-[8px] px-1.5 py-0 h-4 shrink-0 ${
                        c.is_used
                          ? "bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] border-[hsl(var(--success)/0.2)]"
                          : "bg-muted text-muted-foreground border-border/30"
                      }`}
                    >
                      {c.is_used ? t("admin.used") : t("admin.available")}
                    </Badge>
                    <button className="p-1 rounded-md hover:bg-accent/50 transition-colors" onClick={() => copyCode(c.code, c.id)}>
                      {copiedId === c.id
                        ? <Check className="w-3 h-3 text-[hsl(var(--success))]" />
                        : <Copy className="w-3 h-3 text-muted-foreground" />}
                    </button>
                    <button className="p-1 rounded-md hover:bg-destructive/10 transition-colors" onClick={() => deleteCode(c.id)}>
                      <Trash2 className="w-3 h-3 text-destructive/70" />
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
