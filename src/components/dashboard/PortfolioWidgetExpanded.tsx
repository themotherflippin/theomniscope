import { useMemo } from "react";
import { useMarketData } from "@/hooks/useMarketData";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Droplets,
  BarChart3,
  Activity,
  Zap,
} from "lucide-react";
import { formatNumber, formatPrice, formatPct } from "@/lib/formatters";

export function PortfolioWidgetExpanded() {
  const { tokens, risks } = useMarketData();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    if (tokens.length === 0) return null;

    const totalMarketCap = tokens.reduce((s, t) => s + t.marketCap, 0);
    const totalVolume24h = tokens.reduce((s, t) => s + t.volume24h, 0);
    const totalLiquidity = tokens.reduce((s, t) => s + t.liquidity, 0);
    const avgChange24h = tokens.reduce((s, t) => s + t.priceChange24h, 0) / tokens.length;
    const avgChange1h = tokens.reduce((s, t) => s + t.priceChange1h, 0) / tokens.length;

    const gainers = [...tokens].filter(t => t.priceChange24h > 0).sort((a, b) => b.priceChange24h - a.priceChange24h);
    const losers = [...tokens].filter(t => t.priceChange24h < 0).sort((a, b) => a.priceChange24h - b.priceChange24h);

    const topByMarketCap = [...tokens].filter(t => t.marketCap > 0).sort((a, b) => b.marketCap - a.marketCap).slice(0, 5);
    const topByVolume = [...tokens].filter(t => t.volume24h > 0).sort((a, b) => b.volume24h - a.volume24h).slice(0, 5);

    // Chain breakdown
    const byChain = new Map<string, { count: number; marketCap: number; volume: number }>();
    tokens.forEach(t => {
      const existing = byChain.get(t.chain) || { count: 0, marketCap: 0, volume: 0 };
      existing.count++;
      existing.marketCap += t.marketCap;
      existing.volume += t.volume24h;
      byChain.set(t.chain, existing);
    });

    // Buy/sell pressure
    const totalBuys = tokens.reduce((s, t) => s + t.buyCount, 0);
    const totalSells = tokens.reduce((s, t) => s + t.sellCount, 0);

    // Risk distribution
    let lowRisk = 0, medRisk = 0, highRisk = 0;
    tokens.forEach(t => {
      const r = risks.get(t.id);
      if (!r || r.score < 30) lowRisk++;
      else if (r.score < 60) medRisk++;
      else highRisk++;
    });

    return {
      totalMarketCap,
      totalVolume24h,
      totalLiquidity,
      avgChange24h,
      avgChange1h,
      gainers: gainers.slice(0, 3),
      losers: losers.slice(0, 3),
      topByMarketCap,
      topByVolume,
      byChain: Array.from(byChain.entries()).sort((a, b) => b[1].marketCap - a[1].marketCap),
      totalBuys,
      totalSells,
      lowRisk,
      medRisk,
      highRisk,
    };
  }, [tokens, risks]);

  if (!stats) return <p className="text-xs text-muted-foreground text-center py-4">Loading…</p>;

  const positive24h = stats.avgChange24h >= 0;
  const positive1h = stats.avgChange1h >= 0;

  return (
    <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1 -mr-1">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Total Market Cap" value={formatNumber(stats.totalMarketCap)} />
        <StatCard label="24h Volume" value={formatNumber(stats.totalVolume24h)} />
        <StatCard label="Total Liquidity" value={formatNumber(stats.totalLiquidity)} />
        <StatCard label="Tokens Tracked" value={String(tokens.length)} />
      </div>

      {/* Performance */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-card/50 border border-border/30 p-2.5">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Avg 1h Change</p>
          <div className={`flex items-center gap-1 text-sm font-bold font-mono ${positive1h ? "text-success" : "text-danger"}`}>
            {positive1h ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {formatPct(stats.avgChange1h)}
          </div>
        </div>
        <div className="rounded-xl bg-card/50 border border-border/30 p-2.5">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Avg 24h Change</p>
          <div className={`flex items-center gap-1 text-sm font-bold font-mono ${positive24h ? "text-success" : "text-danger"}`}>
            {positive24h ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {formatPct(stats.avgChange24h)}
          </div>
        </div>
      </div>

      {/* Buy/Sell Pressure */}
      <div className="rounded-xl bg-card/50 border border-border/30 p-2.5">
        <div className="flex items-center gap-1.5 mb-2">
          <Activity className="w-3 h-3 text-primary" />
          <p className="text-[10px] font-semibold">Buy / Sell Pressure (24h)</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="h-2 rounded-full bg-muted overflow-hidden flex">
              {(stats.totalBuys + stats.totalSells) > 0 && (
                <>
                  <div
                    className="h-full bg-success rounded-l-full"
                    style={{ width: `${(stats.totalBuys / (stats.totalBuys + stats.totalSells)) * 100}%` }}
                  />
                  <div
                    className="h-full bg-danger rounded-r-full"
                    style={{ width: `${(stats.totalSells / (stats.totalBuys + stats.totalSells)) * 100}%` }}
                  />
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2 text-[9px] font-mono shrink-0">
            <span className="text-success">{stats.totalBuys.toLocaleString()} buys</span>
            <span className="text-danger">{stats.totalSells.toLocaleString()} sells</span>
          </div>
        </div>
      </div>

      {/* Risk Distribution */}
      <div className="rounded-xl bg-card/50 border border-border/30 p-2.5">
        <div className="flex items-center gap-1.5 mb-2">
          <Zap className="w-3 h-3 text-warning" />
          <p className="text-[10px] font-semibold">Risk Distribution</p>
        </div>
        <div className="flex gap-2">
          <RiskChip label="Low" count={stats.lowRisk} color="text-success bg-success/10" />
          <RiskChip label="Medium" count={stats.medRisk} color="text-warning bg-warning/10" />
          <RiskChip label="High" count={stats.highRisk} color="text-danger bg-danger/10" />
        </div>
      </div>

      {/* Top Gainers / Losers */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-card/50 border border-border/30 p-2.5">
          <div className="flex items-center gap-1 mb-1.5">
            <TrendingUp className="w-3 h-3 text-success" />
            <p className="text-[9px] font-semibold uppercase tracking-wider">Top Gainers</p>
          </div>
          {stats.gainers.map(t => (
            <TokenRow key={t.id} token={t} onClick={() => navigate(`/token/${t.id}`)} />
          ))}
          {stats.gainers.length === 0 && <p className="text-[9px] text-muted-foreground">None</p>}
        </div>
        <div className="rounded-xl bg-card/50 border border-border/30 p-2.5">
          <div className="flex items-center gap-1 mb-1.5">
            <TrendingDown className="w-3 h-3 text-danger" />
            <p className="text-[9px] font-semibold uppercase tracking-wider">Top Losers</p>
          </div>
          {stats.losers.map(t => (
            <TokenRow key={t.id} token={t} onClick={() => navigate(`/token/${t.id}`)} />
          ))}
          {stats.losers.length === 0 && <p className="text-[9px] text-muted-foreground">None</p>}
        </div>
      </div>

      {/* Top by Market Cap */}
      <div className="rounded-xl bg-card/50 border border-border/30 p-2.5">
        <div className="flex items-center gap-1.5 mb-2">
          <BarChart3 className="w-3 h-3 text-primary" />
          <p className="text-[10px] font-semibold">Top by Market Cap</p>
        </div>
        <div className="space-y-1">
          {stats.topByMarketCap.map((t, i) => (
            <button
              key={t.id}
              onClick={(e) => { e.stopPropagation(); navigate(`/token/${t.id}`); }}
              className="w-full flex items-center gap-2 py-1 px-1 rounded-lg hover:bg-accent/40 transition-colors"
            >
              <span className="text-[9px] text-muted-foreground w-3 text-right font-mono">{i + 1}</span>
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary shrink-0">
                {t.symbol.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[10px] font-semibold truncate">{t.symbol}</p>
              </div>
              <span className="text-[9px] font-mono text-muted-foreground">{formatNumber(t.marketCap)}</span>
              <PctBadge value={t.priceChange24h} />
            </button>
          ))}
        </div>
      </div>

      {/* Top by Volume */}
      <div className="rounded-xl bg-card/50 border border-border/30 p-2.5">
        <div className="flex items-center gap-1.5 mb-2">
          <Droplets className="w-3 h-3 text-chart-cyan" />
          <p className="text-[10px] font-semibold">Top by Volume (24h)</p>
        </div>
        <div className="space-y-1">
          {stats.topByVolume.map((t, i) => (
            <button
              key={t.id}
              onClick={(e) => { e.stopPropagation(); navigate(`/token/${t.id}`); }}
              className="w-full flex items-center gap-2 py-1 px-1 rounded-lg hover:bg-accent/40 transition-colors"
            >
              <span className="text-[9px] text-muted-foreground w-3 text-right font-mono">{i + 1}</span>
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary shrink-0">
                {t.symbol.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[10px] font-semibold truncate">{t.symbol}</p>
              </div>
              <span className="text-[9px] font-mono text-muted-foreground">{formatNumber(t.volume24h)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chain Breakdown */}
      <div className="rounded-xl bg-card/50 border border-border/30 p-2.5">
        <p className="text-[10px] font-semibold mb-2">Chain Breakdown</p>
        <div className="space-y-1.5">
          {stats.byChain.map(([chain, data]) => (
            <div key={chain} className="flex items-center gap-2 text-[10px]">
              <span className="font-semibold uppercase w-12 shrink-0">{chain}</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary/60 rounded-full"
                  style={{ width: `${stats.totalMarketCap > 0 ? (data.marketCap / stats.totalMarketCap) * 100 : 0}%` }}
                />
              </div>
              <span className="font-mono text-muted-foreground shrink-0 w-14 text-right">
                {formatNumber(data.marketCap)}
              </span>
              <span className="text-muted-foreground shrink-0 w-4 text-right">{data.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Source */}
      <p className="text-[8px] text-muted-foreground text-center font-mono">
        Source: CoinMarketCap + DexScreener · Live data · {tokens.length} tokens
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card/50 border border-border/30 p-2.5">
      <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-bold font-mono">{value}</p>
    </div>
  );
}

function PctBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span className={`text-[9px] font-mono font-semibold flex items-center gap-0.5 ${positive ? "text-success" : "text-danger"}`}>
      {positive ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function TokenRow({ token, onClick }: { token: { id: string; symbol: string; price: number; priceChange24h: number }; onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="w-full flex items-center justify-between py-0.5 hover:bg-accent/30 rounded px-1 transition-colors"
    >
      <span className="text-[10px] font-semibold">{token.symbol}</span>
      <PctBadge value={token.priceChange24h} />
    </button>
  );
}

function RiskChip({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`flex-1 rounded-lg px-2 py-1.5 text-center ${color}`}>
      <p className="text-sm font-bold">{count}</p>
      <p className="text-[8px] uppercase tracking-wider">{label}</p>
    </div>
  );
}
