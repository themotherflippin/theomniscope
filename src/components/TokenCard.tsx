import { formatPrice, formatPct, formatNumber, chainLabel, dexLabel } from '@/lib/formatters';
import { RiskBadge } from './RiskBadge';
import type { Token, RiskReport } from '@/lib/types';
import { Star, TrendingUp, Droplets, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TokenCardProps {
  token: Token;
  risk?: RiskReport;
  onSelect: () => void;
  onToggleFavorite?: () => void;
  showChain?: boolean;
  compact?: boolean;
}

export function TokenCard({ token, risk, onSelect, onToggleFavorite, showChain = true, compact }: TokenCardProps) {
  const volumeSpike = token.volume5m > (token.volume1h / 12) * 2;

  if (compact) {
    return (
      <div
        onClick={onSelect}
        className="flex items-center gap-3 px-4 py-3 border-b border-border/50 active:bg-accent/30 cursor-pointer transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground text-sm">{token.symbol}</span>
            {showChain && (
              <span className="text-[10px] text-muted-foreground font-mono">{chainLabel(token.chain)}</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{token.name}</span>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm text-foreground">{formatPrice(token.price)}</p>
          <p className={`font-mono text-xs ${token.priceChange24h >= 0 ? 'text-success' : 'text-danger'}`}>
            {formatPct(token.priceChange24h)}
          </p>
        </div>
        {risk && <RiskBadge score={risk.score} level={risk.level} showScore={false} />}
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      className="gradient-card rounded-xl p-4 cursor-pointer active:scale-[0.98] transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-sm font-bold text-foreground">
            {token.symbol.slice(0, 2)}
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground">{token.symbol}</span>
              {volumeSpike && (
                <Badge className="bg-warning/20 text-warning border-warning/30 text-[9px] px-1 py-0">
                  🔥 SPIKE
                </Badge>
              )}
            </div>
            {showChain && (
              <span className="text-[10px] text-muted-foreground font-mono">
                {chainLabel(token.chain)} · {dexLabel(token.dex)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {risk && <RiskBadge score={risk.score} level={risk.level} />}
          {onToggleFavorite && (
            <button
              onClick={e => { e.stopPropagation(); onToggleFavorite(); }}
              className="p-1"
            >
              <Star className={`w-4 h-4 ${token.isFavorite ? 'text-warning fill-warning' : 'text-muted-foreground'}`} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-lg font-mono font-bold text-foreground">{formatPrice(token.price)}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-xs font-mono ${token.priceChange5m >= 0 ? 'text-success' : 'text-danger'}`}>
              5m {formatPct(token.priceChange5m)}
            </span>
            <span className={`text-xs font-mono ${token.priceChange1h >= 0 ? 'text-success' : 'text-danger'}`}>
              1h {formatPct(token.priceChange1h)}
            </span>
            <span className={`text-xs font-mono ${token.priceChange24h >= 0 ? 'text-success' : 'text-danger'}`}>
              24h {formatPct(token.priceChange24h)}
            </span>
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span className="font-mono">{formatNumber(token.volume5m)}</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Droplets className="w-3 h-3" />
            <span className="font-mono">{formatNumber(token.liquidity)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
