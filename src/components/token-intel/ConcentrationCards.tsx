import { PieChart, Users, BarChart3 } from "lucide-react";
import type { ConcentrationMetrics } from "@/lib/tokenIntel.types";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  metrics: ConcentrationMetrics | undefined;
  loading: boolean;
}

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="gradient-card rounded-lg p-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-mono font-bold tabular-nums">{value}</span>
    </div>
  );
}

export default function ConcentrationCards({ metrics, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const giniColor =
    metrics.giniApprox > 0.7
      ? "text-danger"
      : metrics.giniApprox > 0.4
        ? "text-warning"
        : "text-success";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <MetricCard
        label="Top 10%"
        value={`${metrics.top10Pct.toFixed(1)}%`}
        icon={PieChart}
        color={metrics.top10Pct > 60 ? "text-danger" : "text-primary"}
      />
      <MetricCard
        label="Top 25%"
        value={`${metrics.top25Pct.toFixed(1)}%`}
        icon={BarChart3}
        color="text-primary"
      />
      <MetricCard
        label="Gini Index"
        value={metrics.giniApprox.toFixed(2)}
        icon={Users}
        color={giniColor}
      />
      <MetricCard
        label="Holders"
        value={metrics.holderCount?.toLocaleString() ?? "—"}
        icon={Users}
        color="text-muted-foreground"
      />
    </div>
  );
}
