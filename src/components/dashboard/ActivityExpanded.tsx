import { useMarketData } from "@/hooks/useMarketData";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";

export function ActivityExpanded() {
  const { tokens } = useMarketData();

  const gainers = tokens
    .filter((t) => t.priceChange24h > 0)
    .sort((a, b) => b.priceChange24h - a.priceChange24h)
    .slice(0, 10);
  
  const losers = tokens
    .filter((t) => t.priceChange24h < 0)
    .sort((a, b) => a.priceChange24h - b.priceChange24h)
    .slice(0, 10);

  const totalGainers = tokens.filter(t => t.priceChange24h > 0).length;
  const totalLosers = tokens.filter(t => t.priceChange24h < 0).length;

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-success" />
          <span className="text-xs font-semibold text-success">{totalGainers} up</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingDown className="w-3.5 h-3.5 text-danger" />
          <span className="text-xs font-semibold text-danger">{totalLosers} down</span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden flex">
        <div
          className="h-full bg-success rounded-full"
          style={{ width: `${tokens.length ? (totalGainers / tokens.length) * 100 : 50}%` }}
        />
        <div
          className="h-full bg-danger rounded-full"
          style={{ width: `${tokens.length ? (totalLosers / tokens.length) * 100 : 50}%` }}
        />
      </div>

      {/* Top gainers */}
      <div className="space-y-1">
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Top Gainers</p>
        {gainers.map(t => (
          <div key={t.id} className="flex items-center justify-between py-0.5 px-1">
            <span className="text-[11px] font-semibold">{t.symbol}</span>
            <span className="text-[10px] font-mono font-semibold text-success flex items-center gap-0.5">
              <ArrowUpRight className="w-2.5 h-2.5" />
              +{t.priceChange24h.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>

      {/* Top losers */}
      <div className="space-y-1">
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Top Losers</p>
        {losers.map(t => (
          <div key={t.id} className="flex items-center justify-between py-0.5 px-1">
            <span className="text-[11px] font-semibold">{t.symbol}</span>
            <span className="text-[10px] font-mono font-semibold text-danger flex items-center gap-0.5">
              <ArrowDownRight className="w-2.5 h-2.5" />
              {t.priceChange24h.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
