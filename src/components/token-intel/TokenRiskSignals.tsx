import {
  ShieldCheck,
  Shield,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
import type { TokenRiskFlag } from "@/lib/tokenIntel.types";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  flags: TokenRiskFlag[];
  loading: boolean;
}

const SEVERITY_ICON: Record<string, React.ElementType> = {
  critical: XCircle,
  danger: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: "text-danger",
  danger: "text-danger",
  warning: "text-warning",
  info: "text-muted-foreground",
};

export default function TokenRiskSignals({ flags, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-lg" />
        ))}
      </div>
    );
  }

  const overallSeverity = flags.reduce(
    (max, f) => {
      const order = { critical: 4, danger: 3, warning: 2, info: 1 };
      return order[f.severity] > order[max] ? f.severity : max;
    },
    "info" as "info" | "warning" | "danger" | "critical"
  );

  const HeaderIcon =
    overallSeverity === "info" || flags.length === 0
      ? ShieldCheck
      : overallSeverity === "warning"
        ? Shield
        : ShieldAlert;

  const headerColor =
    overallSeverity === "info" || flags.length === 0
      ? "text-success"
      : overallSeverity === "warning"
        ? "text-warning"
        : "text-danger";

  return (
    <div className="gradient-card rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <HeaderIcon className={`w-4 h-4 ${headerColor}`} />
        <span className="text-sm font-display font-semibold">Risk Signals</span>
        <span className="text-[10px] font-mono text-muted-foreground ml-auto">
          {flags.length} flag{flags.length !== 1 ? "s" : ""}
        </span>
      </div>

      {flags.length === 0 ? (
        <div className="flex items-center gap-2 py-2">
          <CheckCircle className="w-4 h-4 text-success" />
          <span className="text-xs text-muted-foreground">
            No risk flags detected
          </span>
        </div>
      ) : (
        <div className="space-y-2">
          {flags.map((flag) => {
            const Icon = SEVERITY_ICON[flag.severity] ?? Info;
            const color = SEVERITY_COLOR[flag.severity] ?? "text-muted-foreground";
            return (
              <div
                key={flag.id}
                className="flex items-start gap-2 py-1.5 border-b border-border/20 last:border-0"
              >
                <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${color}`} />
                <div className="min-w-0">
                  <p className="text-xs font-medium">{flag.label}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {flag.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
