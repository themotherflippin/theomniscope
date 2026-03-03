import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import oracleLogo from "@/assets/oracle-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Lock, Plus, Copy, Check, Trash2, ArrowLeft,
  Activity, Clock, Shield, Tag, FileText,
  CheckCircle, Loader2, RefreshCw, Zap, Database, Server,
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

function StatusDot({ ok = true }: { ok?: boolean }) {
  return (
    <span className={`inline-block w-1.5 h-1.5 rounded-full ${ok ? "bg-[hsl(var(--success))]" : "bg-[hsl(var(--danger))]"}`} />
  );
}

function MetricCard({ icon: Icon, label, value, color, ok = true }: {
  icon: React.ElementType; label: string; value: string; color: string; ok?: boolean;
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
        <StatusDot ok={ok} />
      </div>
    </motion.div>
  );
}

function ServiceRow({ name, ok = true }: { name: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[11px] text-muted-foreground">{name}</span>
      <div className="flex items-center gap-1">
        <StatusDot ok={ok} />
        <span className="text-[9px] text-muted-foreground">{ok ? "OK" : "Down"}</span>
      </div>
    </div>
  );
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

  const fetchCodes = useCallback(async () => {
    const { data } = await supabase
      .from("invitation_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setCodes(data);
  }, []);

  useEffect(() => {
    if (authenticated) fetchCodes();
  }, [authenticated, fetchCodes]);

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
  };

  // --- Login screen ---
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
              <Input
                type="email"
                placeholder={t("admin.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                className="pl-10 h-10 text-sm"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder={t("admin.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verifyCredentials()}
                autoComplete="off"
                className="pl-10 h-10 text-sm"
              />
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

  // --- Dashboard (single viewport, no scroll) ---
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
        <h1 className="text-sm font-display font-bold tracking-tight">Administration</h1>
        <div className="w-8" />
      </div>

      {/* Content */}
      <div className="flex-1 px-3 pb-3 flex flex-col gap-2.5 min-h-0">

        {/* Row 1: Metrics */}
        <div className="grid grid-cols-4 gap-2 shrink-0">
          <MetricCard icon={Activity} label="Latency" value="320ms" color="var(--chart-cyan)" />
          <MetricCard icon={Zap} label="Errors" value="0.2%" color="var(--success)" />
          <MetricCard icon={Clock} label="Scanner" value="Active" color="var(--chart-blue)" />
          <MetricCard icon={FileText} label="Reports" value="Idle" color="var(--warning)" />
        </div>

        {/* Row 2: Services + Actions */}
        <div className="grid grid-cols-2 gap-2 shrink-0">
          {/* Services */}
          <div className="rounded-xl border border-border/30 p-2.5" style={{ background: "hsl(var(--widget-market) / 0.5)" }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Server className="w-3 h-3 text-[hsl(var(--chart-blue))]" />
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Services</span>
            </div>
            <ServiceRow name="Moralis API" />
            <ServiceRow name="Database" />
            <ServiceRow name="Edge Functions" />
            <ServiceRow name="Storage" />
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-border/30 p-2.5 flex flex-col gap-1.5" style={{ background: "hsl(var(--widget-actions) / 0.5)" }}>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Zap className="w-3 h-3 text-[hsl(var(--chart-cyan))]" />
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Actions</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-[10px] h-7 gap-1"
              onClick={runScanner}
              disabled={scannerRunning}
            >
              {scannerRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Run Scanner
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-[10px] h-7 gap-1"
              onClick={createCode}
              disabled={genLoading}
            >
              {genLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              {t("admin.generate")}
            </Button>
            <div className="flex items-center justify-center gap-3 mt-auto">
              <div className="text-center">
                <p className="text-sm font-bold font-mono">{freeCodes}</p>
                <p className="text-[8px] text-muted-foreground uppercase">Available</p>
              </div>
              <div className="w-px h-5 bg-border/40" />
              <div className="text-center">
                <p className="text-sm font-bold font-mono">{usedCodes}</p>
                <p className="text-[8px] text-muted-foreground uppercase">Used</p>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Invitation Codes (scrollable list) */}
        <div
          className="rounded-xl border border-border/30 p-2.5 flex-1 min-h-0 flex flex-col"
          style={{ background: "hsl(var(--widget-alerts) / 0.4)" }}
        >
          <div className="flex items-center justify-between mb-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-[hsl(var(--warning))]" />
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">
                Access Codes
              </span>
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
