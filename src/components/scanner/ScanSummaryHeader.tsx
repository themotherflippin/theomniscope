import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Clock,
  Hash,
  Layers,
  Users,
} from "lucide-react";
import type { WalletScanResult } from "@/lib/walletScanner.types";
import { shortenAddress } from "@/lib/formatters";

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toFixed(2);
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface ScanSummaryHeaderProps {
  data: WalletScanResult;
}

export default function ScanSummaryHeader({ data }: ScanSummaryHeaderProps) {
  return (
    <div className="gradient-card rounded-xl p-4 space-y-3">
      {/* Address */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-mono font-semibold">{shortenAddress(data.address)}</p>
            <p className="text-[10px] text-muted-foreground">{data.chain.toUpperCase()} · Depth {data.depth}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-mono font-bold tabular-nums">{data.totalTxCount.toLocaleString()}</p>
          <p className="text-[9px] text-muted-foreground uppercase">Total Tx</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-lg bg-success/10 p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <ArrowDownRight className="w-3 h-3 text-success" />
          </div>
          <p className="text-sm font-mono font-bold tabular-nums text-success">
            {formatVolume(data.totalVolumeIn)}
          </p>
          <p className="text-[8px] text-muted-foreground uppercase">Volume In</p>
        </div>
        <div className="rounded-lg bg-danger/10 p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <ArrowUpRight className="w-3 h-3 text-danger" />
          </div>
          <p className="text-sm font-mono font-bold tabular-nums text-danger">
            {formatVolume(data.totalVolumeOut)}
          </p>
          <p className="text-[8px] text-muted-foreground uppercase">Volume Out</p>
        </div>
        <div className="rounded-lg bg-secondary/50 p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Users className="w-3 h-3 text-primary" />
          </div>
          <p className="text-sm font-mono font-bold tabular-nums">
            {data.counterparties.length}
          </p>
          <p className="text-[8px] text-muted-foreground uppercase">Counterparties</p>
        </div>
        <div className="rounded-lg bg-secondary/50 p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Layers className="w-3 h-3 text-primary" />
          </div>
          <p className="text-sm font-mono font-bold tabular-nums">
            {data.contracts.length}
          </p>
          <p className="text-[8px] text-muted-foreground uppercase">Contracts</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          First: {formatDate(data.firstSeen)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Last: {formatDate(data.lastSeen)}
        </span>
      </div>
    </div>
  );
}
