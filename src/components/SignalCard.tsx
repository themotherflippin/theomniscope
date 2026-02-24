import { SignalBadge } from './SignalBadge';
import { RiskBadge } from './RiskBadge';
import type { Signal } from '@/lib/types';
import { Target, ShieldAlert, TrendingUp, ArrowDownUp } from 'lucide-react';

const strategyIcons = {
  breakout: TrendingUp,
  reversal: ArrowDownUp,
  trend_follow: Target,
};

const strategyLabels = {
  breakout: 'Breakout',
  reversal: 'Reversal',
  trend_follow: 'Trend Follow',
};

interface SignalCardProps {
  signal: Signal;
  onClick?: () => void;
}

export function SignalCard({ signal, onClick }: SignalCardProps) {
  const Icon = strategyIcons[signal.strategy];

  return (
    <div
      onClick={onClick}
      className="gradient-card rounded-lg p-4 cursor-pointer hover:bg-accent/30 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <span className="font-bold text-foreground">{signal.tokenSymbol}</span>
          <span className="text-xs text-muted-foreground">{strategyLabels[signal.strategy]}</span>
        </div>
        <SignalBadge type={signal.type} confidence={signal.confidence} />
      </div>

      {signal.type === 'ENTRY' && (
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs font-mono">
          <div>
            <span className="text-muted-foreground">Entry: </span>
            <span className="text-foreground">{signal.entryZone}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Stop: </span>
            <span className="text-danger">{signal.stopLoss}</span>
          </div>
          <div>
            <span className="text-muted-foreground">TP1: </span>
            <span className="text-success">{signal.takeProfit1}</span>
          </div>
          <div>
            <span className="text-muted-foreground">TP2: </span>
            <span className="text-success">{signal.takeProfit2}</span>
          </div>
        </div>
      )}

      <div className="space-y-1 mb-3">
        {signal.reasons.map((r, i) => (
          <p key={i} className="text-xs text-secondary-foreground flex items-start gap-1.5">
            <span className="text-primary mt-0.5">›</span>
            {r}
          </p>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-mono">
          {signal.invalidation && `Invalidation: ${signal.invalidation}`}
        </span>
        {signal.riskScore > 0 && (
          <div className="flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground font-mono">Risk {signal.riskScore}</span>
          </div>
        )}
      </div>
    </div>
  );
}
