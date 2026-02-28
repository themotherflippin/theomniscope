import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  Shield,
  Search,
  Bell,
  Clock,
  ExternalLink,
  ChevronRight,
  Zap,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
} from "lucide-react";
import { useMarketData } from "@/hooks/useMarketData";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Token, RiskReport, Alert, Signal, OpportunityScore } from "@/lib/types";

function formatUSD(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function timeAgo(ts: number): string {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

// Severity color mapping
function severityClass(priority: string) {
  switch (priority) {
    case "critical": return "bg-danger/15 text-danger border-danger/30";
    case "high": return "bg-warning/15 text-warning border-warning/30";
    case "medium": return "bg-primary/15 text-primary border-primary/30";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

function riskLevelClass(level: string) {
  switch (level) {
    case "critical": return "text-danger";
    case "high": return "text-warning";
    case "medium": return "text-primary";
    default: return "text-success";
  }
}

// --- Sub-components ---

function StatCard({ icon: Icon, label, value, trend, className = "" }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  className?: string;
}) {
  return (
    <div className={`gradient-card rounded-lg p-3 flex items-center gap-3 ${className}`}>
      <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-4.5 h-4.5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground truncate">{label}</p>
        <p className="text-sm font-semibold font-mono tabular-nums flex items-center gap-1">
          {value}
          {trend === "up" && <ArrowUpRight className="w-3 h-3 text-success" />}
          {trend === "down" && <ArrowDownRight className="w-3 h-3 text-danger" />}
        </p>
      </div>
    </div>
  );
}

function AlertStreamItem({ alert, onClick }: { alert: Alert; onClick: () => void }) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-accent/50 ${
        !alert.read ? "gradient-card-elevated" : "gradient-card opacity-70"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 shrink-0 mt-0.5 ${severityClass(alert.priority)}`}>
          {alert.priority.toUpperCase()}
        </Badge>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium truncate">{alert.message}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-mono text-muted-foreground">{alert.tokenSymbol}</span>
            <span className="text-[10px] text-muted-foreground">{timeAgo(alert.timestamp)}</span>
          </div>
        </div>
        {!alert.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
      </div>
    </motion.button>
  );
}

function RiskyTokenRow({ token, risk, onClick }: { token: Token; risk: RiskReport; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-lg gradient-card hover:bg-accent/50 transition-colors"
    >
      <div className="w-8 h-8 rounded-full bg-danger/10 flex items-center justify-center shrink-0">
        <Shield className={`w-4 h-4 ${riskLevelClass(risk.level)}`} />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{token.symbol}</span>
          <span className="text-[10px] text-muted-foreground uppercase">{token.chain}</span>
        </div>
        <p className="text-[11px] text-muted-foreground truncate">
          {risk.flags[0]?.label ?? "Elevated risk"}
        </p>
      </div>
      <div className="text-right shrink-0">
        <span className={`text-sm font-mono font-bold ${riskLevelClass(risk.level)}`}>{risk.score}</span>
        <p className="text-[10px] text-muted-foreground">/ 100</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}

function TrendingTokenRow({ token, onClick }: { token: Token; onClick: () => void }) {
  const positive = token.priceChange24h >= 0;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-lg gradient-card hover:bg-accent/50 transition-colors"
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        positive ? "bg-success/10" : "bg-danger/10"
      }`}>
        {positive ? (
          <TrendingUp className="w-4 h-4 text-success" />
        ) : (
          <ArrowDownRight className="w-4 h-4 text-danger" />
        )}
      </div>
      <div className="min-w-0 flex-1 text-left">
        <span className="text-sm font-semibold">{token.symbol}</span>
        <p className="text-[11px] text-muted-foreground font-mono">{formatUSD(token.price)}</p>
      </div>
      <div className="text-right shrink-0">
        <span className={`text-sm font-mono font-bold ${positive ? "text-success" : "text-danger"}`}>
          {positive ? "+" : ""}{token.priceChange24h.toFixed(1)}%
        </span>
        <p className="text-[10px] text-muted-foreground">{formatUSD(token.volume24h)} vol</p>
      </div>
    </button>
  );
}

function OpportunityRow({ opp, onClick }: { opp: OpportunityScore; onClick: () => void }) {
  const gradeColors: Record<string, string> = {
    S: "bg-primary text-primary-foreground",
    A: "bg-success text-success-foreground",
    B: "bg-warning text-warning-foreground",
    C: "bg-muted text-muted-foreground",
    D: "bg-danger/50 text-danger",
    F: "bg-danger text-danger-foreground",
  };
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-lg gradient-card hover:bg-accent/50 transition-colors"
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${gradeColors[opp.grade] ?? "bg-muted text-muted-foreground"}`}>
        {opp.grade}
      </div>
      <div className="min-w-0 flex-1 text-left">
        <span className="text-sm font-semibold">{opp.tokenSymbol}</span>
        <p className="text-[11px] text-muted-foreground truncate">{opp.topReasons[0] ?? opp.action}</p>
      </div>
      <div className="text-right shrink-0">
        <span className="text-sm font-mono font-bold">{opp.totalScore}</span>
        <p className="text-[10px] text-muted-foreground">score</p>
      </div>
    </button>
  );
}

// --- Main ---

export default function CommandCenter() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const {
    tokens,
    alerts,
    highRiskTokens,
    oppScores,
    signals,
    dailyBrief,
    unreadAlerts,
    isLoading,
  } = useMarketData();

  const [searchQuery, setSearchQuery] = useState("");

  const trendingTokens = useMemo(
    () =>
      [...tokens]
        .filter((t) => t.volume24h > 0)
        .sort((a, b) => Math.abs(b.priceChange24h) - Math.abs(a.priceChange24h))
        .slice(0, 8),
    [tokens]
  );

  const topOpps = useMemo(
    () =>
      [...oppScores]
        .filter((o) => !o.capped)
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 6),
    [oppScores]
  );

  const recentAlerts = useMemo(() => alerts.slice(0, 15), [alerts]);

  const criticalAlerts = useMemo(
    () => alerts.filter((a) => !a.read && (a.priority === "critical" || a.priority === "high")),
    [alerts]
  );

  const sentimentLabel = dailyBrief.marketSentiment === "bullish" ? "Bullish" : dailyBrief.marketSentiment === "bearish" ? "Bearish" : "Neutral";
  const sentimentIcon = dailyBrief.marketSentiment === "bullish" ? TrendingUp : dailyBrief.marketSentiment === "bearish" ? ArrowDownRight : Activity;

  const goToken = (id: string) => navigate(`/token/${id}`);

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold tracking-tight">Command Center</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time intelligence overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="relative"
            onClick={() => navigate("/alerts")}
          >
            <Bell className="w-4 h-4" />
            {unreadAlerts > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-[9px] font-bold flex items-center justify-center text-danger-foreground">
                {unreadAlerts > 9 ? "9+" : unreadAlerts}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Critical Banner */}
      <AnimatePresence>
        {criticalAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-lg border border-danger/30 bg-danger/10 flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-danger shrink-0 animate-pulse" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-danger">
                {criticalAlerts.length} critical alert{criticalAlerts.length > 1 ? "s" : ""} active
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {criticalAlerts[0]?.message}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/alerts")} className="text-danger shrink-0">
              <Eye className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <StatCard icon={Activity} label="Tokens tracked" value={tokens.length} />
        <StatCard
          icon={sentimentIcon}
          label="Market Sentiment"
          value={sentimentLabel}
          trend={dailyBrief.marketSentiment === "bullish" ? "up" : dailyBrief.marketSentiment === "bearish" ? "down" : "neutral"}
        />
        <StatCard icon={AlertTriangle} label="High risk tokens" value={highRiskTokens.length} />
        <StatCard icon={Zap} label="Active signals" value={signals.length} />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search wallet, token, or contract..."
          className="pl-9 bg-card border-border"
        />
      </div>

      {/* Main Panels */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList className="w-full grid grid-cols-4 h-9">
          <TabsTrigger value="alerts" className="text-xs gap-1">
            <Bell className="w-3.5 h-3.5" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="risk" className="text-xs gap-1">
            <Shield className="w-3.5 h-3.5" />
            Risk
          </TabsTrigger>
          <TabsTrigger value="trending" className="text-xs gap-1">
            <Flame className="w-3.5 h-3.5" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="text-xs gap-1">
            <Zap className="w-3.5 h-3.5" />
            Opps
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold">Live Alert Stream</h2>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate("/alerts")}>
              View All <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          {recentAlerts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No alerts yet</p>
          ) : (
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto scrollbar-thin">
              <AnimatePresence initial={false}>
                {recentAlerts.map((a) => (
                  <AlertStreamItem key={a.id} alert={a} onClick={() => goToken(a.tokenId)} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        <TabsContent value="risk" className="space-y-2">
          <h2 className="text-sm font-semibold mb-1">Top Risky Tokens</h2>
          {highRiskTokens.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No high-risk tokens detected</p>
          ) : (
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto scrollbar-thin">
              {highRiskTokens.slice(0, 10).map(({ token, risk }) => (
                <RiskyTokenRow key={token.id} token={token} risk={risk} onClick={() => goToken(token.id)} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trending" className="space-y-2">
          <h2 className="text-sm font-semibold mb-1">Trending Tokens</h2>
          {trendingTokens.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Loading market data...</p>
          ) : (
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto scrollbar-thin">
              {trendingTokens.map((token) => (
                <TrendingTokenRow key={token.id} token={token} onClick={() => goToken(token.id)} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-2">
          <h2 className="text-sm font-semibold mb-1">Top Opportunities</h2>
          {topOpps.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No opportunities scored yet</p>
          ) : (
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto scrollbar-thin">
              {topOpps.map((opp) => (
                <OpportunityRow key={opp.tokenId} opp={opp} onClick={() => goToken(opp.tokenId)} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2.5">
        <Button
          variant="outline"
          className="h-auto py-3 px-4 flex flex-col items-start gap-1"
          onClick={() => navigate("/lookup")}
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Investigate</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Lookup wallet or token</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-3 px-4 flex flex-col items-start gap-1"
          onClick={() => navigate("/opportunities")}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium">Signals</span>
          </div>
          <span className="text-[10px] text-muted-foreground">View all entry/exit signals</span>
        </Button>
      </div>

      {/* Footer timestamp */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
        <Clock className="w-3 h-3" />
        <span>Last update: {new Date().toLocaleTimeString()}</span>
        {isLoading && <span className="animate-pulse">• Refreshing...</span>}
      </div>
    </div>
  );
}
