import { Badge } from '@/components/ui/badge';
import type { SignalType, Confidence } from '@/lib/types';

const typeConfig: Record<SignalType, { className: string }> = {
  ENTRY: { className: 'bg-success/20 text-success border-success/30' },
  EXIT: { className: 'bg-danger/20 text-danger border-danger/30' },
  HOLD: { className: 'bg-warning/20 text-warning border-warning/30' },
  AVOID: { className: 'bg-danger/30 text-danger border-danger/50' },
};

const confDots: Record<Confidence, number> = { low: 1, medium: 2, high: 3 };

interface SignalBadgeProps {
  type: SignalType;
  confidence?: Confidence;
}

export function SignalBadge({ type, confidence }: SignalBadgeProps) {
  const config = typeConfig[type];
  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="outline" className={`font-mono text-xs font-bold ${config.className}`}>
        {type}
      </Badge>
      {confidence && (
        <span className="flex gap-0.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${
                i < confDots[confidence] ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </span>
      )}
    </div>
  );
}
