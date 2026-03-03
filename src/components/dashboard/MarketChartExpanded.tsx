import { useMarketData } from "@/hooks/useMarketData";
import { ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function MarketChartExpanded() {
  const { tokens, isLoading } = useMarketData();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const sorted = tokens
    .filter((t) => t.marketCap > 0)
    .sort((a, b) => b.marketCap - a.marketCap)
    .slice(0, 15);

  return (
    <div className="space-y-1">
      {sorted.map((t) => {
        const positive = t.priceChange24h >= 0;
        return (
          <button
            key={t.id}
            onClick={() => navigate(`/token/${t.id}`)}
            className="w-full flex items-center justify-between py-1.5 px-1 rounded-lg hover:bg-accent/40 transition-colors text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                {t.symbol.slice(0, 2)}
              </div>
              <span className="text-[11px] font-semibold truncate">{t.symbol}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[10px] font-mono text-muted-foreground">
                ${t.price < 1 ? t.price.toFixed(4) : t.price.toFixed(2)}
              </span>
              <span className={`text-[10px] font-mono font-semibold flex items-center gap-0.5 min-w-[50px] justify-end ${positive ? "text-success" : "text-danger"}`}>
                {positive ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                {Math.abs(t.priceChange24h).toFixed(1)}%
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
