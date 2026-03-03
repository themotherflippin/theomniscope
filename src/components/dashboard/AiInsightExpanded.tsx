import { useMarketData } from "@/hooks/useMarketData";
import { Brain, TrendingUp, TrendingDown, Minus, Shield, Zap } from "lucide-react";

export function AiInsightExpanded() {
  const { dailyBrief, tokens, highRiskTokens, oppScores } = useMarketData();

  const sentiment = dailyBrief.marketSentiment;
  const sentimentColor =
    sentiment === "bullish" ? "text-success" : sentiment === "bearish" ? "text-danger" : "text-warning";
  const SentimentIcon = sentiment === "bullish" ? TrendingUp : sentiment === "bearish" ? TrendingDown : Minus;

  const topOpps = oppScores
    .filter(o => !o.capped && o.totalScore >= 40)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 5);

  const avgChange = tokens.length > 0
    ? tokens.reduce((s, t) => s + t.priceChange24h, 0) / tokens.length
    : 0;

  return (
    <div className="space-y-3">
      {/* Sentiment */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Brain className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className={`text-sm font-semibold capitalize ${sentimentColor}`}>{sentiment}</p>
          <p className="text-[10px] text-muted-foreground">{dailyBrief.smartMoneyTrend}</p>
        </div>
      </div>

      {/* Market overview */}
      <div className="rounded-lg border border-border/20 bg-card/40 p-2.5 space-y-1.5">
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Market Snapshot</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-sm font-bold font-mono">{tokens.length}</p>
            <p className="text-[8px] text-muted-foreground">Tokens</p>
          </div>
          <div>
            <p className={`text-sm font-bold font-mono ${avgChange >= 0 ? "text-success" : "text-danger"}`}>
              {avgChange >= 0 ? "+" : ""}{avgChange.toFixed(1)}%
            </p>
            <p className="text-[8px] text-muted-foreground">Avg 24h</p>
          </div>
          <div>
            <p className="text-sm font-bold font-mono text-danger">{highRiskTokens.length}</p>
            <p className="text-[8px] text-muted-foreground">High Risk</p>
          </div>
        </div>
      </div>

      {/* Top opportunities */}
      {topOpps.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-success" />
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Top Opportunities</p>
          </div>
          {topOpps.map(o => (
            <div key={o.tokenId} className="flex items-center justify-between py-1 px-1">
              <span className="text-[11px] font-semibold">{o.tokenSymbol}</span>
              <span className="text-[10px] font-mono text-success">{o.totalScore}/100</span>
            </div>
          ))}
        </div>
      )}

      {/* High risk */}
      {highRiskTokens.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-danger" />
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Risk Alerts</p>
          </div>
          {highRiskTokens.slice(0, 5).map(({ token, risk }) => (
            <div key={token.id} className="flex items-center justify-between py-1 px-1">
              <span className="text-[11px] font-semibold">{token.symbol}</span>
              <span className="text-[10px] font-mono text-danger">{risk.score}/100</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
