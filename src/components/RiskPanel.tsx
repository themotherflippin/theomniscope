import type { Token, RiskReport } from '@/lib/types';
import { RiskBadge } from './RiskBadge';
import { ShieldAlert } from 'lucide-react';

interface RiskPanelProps {
  token: Token;
  risk: RiskReport;
}

export function RiskPanel({ risk }: RiskPanelProps) {
  const severityOrder = { critical: 0, danger: 1, warning: 2, info: 3 };
  const sorted = [...risk.flags].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return (
    <div className="gradient-card rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Risk Scanner</h3>
        </div>
        <RiskBadge score={risk.score} level={risk.level} />
      </div>

      {/* Risk meter */}
      <div className="mb-4">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${risk.score}%`,
              background: risk.score >= 70
                ? 'hsl(0, 72%, 51%)'
                : risk.score >= 45
                ? 'hsl(38, 92%, 50%)'
                : risk.score >= 25
                ? 'hsl(38, 70%, 60%)'
                : 'hsl(142, 71%, 45%)',
            }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-muted-foreground font-mono">
          <span>Safe</span>
          <span>Critical</span>
        </div>
      </div>

      <div className="space-y-2">
        {sorted.map(flag => {
          const colors = {
            info: 'border-l-primary',
            warning: 'border-l-warning',
            danger: 'border-l-danger',
            critical: 'border-l-danger',
          };
          return (
            <div
              key={flag.id}
              className={`border-l-2 ${colors[flag.severity]} pl-3 py-1.5`}
            >
              <p className="text-xs font-semibold text-foreground">{flag.label}</p>
              <p className="text-[11px] text-muted-foreground">{flag.detail}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
