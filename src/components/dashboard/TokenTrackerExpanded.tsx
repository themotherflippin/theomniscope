import { useMarketData } from "@/hooks/useMarketData";
import { ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function TokenTrackerExpanded() {
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
    .filter((t) => t.volume24h > 0)
    .sort((a, b) => b.marketCap - a.marketCap)
    .slice(0, 20);

  return (
    <div className="space-y-1">
      {sorted.map((token) => {
        const positive = token.priceChange24h >= 0;
        return (
          <button
            key={token.id}
            onClick={() => navigate(`/token/${token.id}`)}
            className="w-full flex items-center gap-2 py-1.5 px-1 rounded-lg hover:bg-accent/40 transition-colors text-left"
          >
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
              {token.symbol.slice(0, 2)}
            </div>
            <span className="text-[11px] font-semibold flex-1 truncate">{token.symbol}</span>
            <span className="text-[10px] font-mono text-muted-foreground">
              ${token.price < 1 ? token.price.toFixed(4) : token.price.toFixed(2)}
            </span>
            <span className={`text-[10px] font-mono font-semibold flex items-center gap-0.5 ${positive ? "text-success" : "text-danger"}`}>
              {positive ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
              {Math.abs(token.priceChange24h).toFixed(1)}%
            </span>
          </button>
        );
      })}
    </div>
  );
}
