import { Badge } from '@/components/ui/badge';
import type { RiskLevel } from '@/lib/types';

const levelConfig: Record<RiskLevel, { label: string; className: string }> = {
  low: { label: 'Low Risk', className: 'bg-success/20 text-success border-success/30' },
  medium: { label: 'Medium', className: 'bg-warning/20 text-warning border-warning/30' },
  high: { label: 'High Risk', className: 'bg-danger/20 text-danger border-danger/30' },
  critical: { label: 'AVOID', className: 'bg-danger/30 text-danger border-danger/50 animate-pulse-glow' },
};

interface RiskBadgeProps {
  score: number;
  level: RiskLevel;
  showScore?: boolean;
}

export function RiskBadge({ score, level, showScore = true }: RiskBadgeProps) {
  const config = levelConfig[level];
  return (
    <Badge variant="outline" className={`font-mono text-xs ${config.className}`}>
      {config.label}{showScore && ` ${score}`}
    </Badge>
  );
}
