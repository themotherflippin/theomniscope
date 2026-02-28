import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { shortenAddress } from "@/lib/formatters";
import type { WalletScanResult, CounterpartyResult } from "@/lib/walletScanner.types";

function FlowBar({
  label,
  value,
  maxValue,
  color,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono w-20 truncate text-muted-foreground">{label}</span>
      <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <span className="text-[10px] font-mono w-16 text-right tabular-nums">
        {value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toFixed(2)}
      </span>
    </div>
  );
}

interface FlowViewProps {
  data: WalletScanResult;
  onInvestigate: (addr: string) => void;
}

export default function FlowView({ data, onInvestigate }: FlowViewProps) {
  const maxSourceVol = Math.max(...data.topSources.map((s) => s.volumeIn), 1);
  const maxDestVol = Math.max(...data.topDestinations.map((d) => d.volumeOut), 1);

  return (
    <div className="space-y-4">
      {/* Volume summary */}
      <div className="gradient-card rounded-xl p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <ArrowDownRight className="w-4 h-4 text-success" />
              <span className="text-xs font-semibold text-success">Inflows</span>
            </div>
            <p className="text-xl font-mono font-bold tabular-nums text-success">
              {data.totalVolumeIn >= 1000
                ? `${(data.totalVolumeIn / 1000).toFixed(1)}K`
                : data.totalVolumeIn.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <ArrowUpRight className="w-4 h-4 text-danger" />
              <span className="text-xs font-semibold text-danger">Outflows</span>
            </div>
            <p className="text-xl font-mono font-bold tabular-nums text-danger">
              {data.totalVolumeOut >= 1000
                ? `${(data.totalVolumeOut / 1000).toFixed(1)}K`
                : data.totalVolumeOut.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Net flow */}
        <div className="mt-3 text-center">
          <p className="text-[10px] text-muted-foreground">Net Flow</p>
          <p
            className={`text-sm font-mono font-bold tabular-nums ${
              data.totalVolumeIn - data.totalVolumeOut >= 0 ? "text-success" : "text-danger"
            }`}
          >
            {data.totalVolumeIn - data.totalVolumeOut >= 0 ? "+" : ""}
            {(data.totalVolumeIn - data.totalVolumeOut).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Top sources */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <ArrowDownRight className="w-3 h-3 text-success" /> Top Sources
        </h3>
        <div className="space-y-1.5">
          {data.topSources.slice(0, 8).map((s) => (
            <button
              key={s.address}
              onClick={() => onInvestigate(s.address)}
              className="w-full text-left hover:bg-accent/30 rounded-md transition-colors"
            >
              <FlowBar
                label={shortenAddress(s.address)}
                value={s.volumeIn}
                maxValue={maxSourceVol}
                color="bg-success"
              />
            </button>
          ))}
          {data.topSources.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">No inflows detected</p>
          )}
        </div>
      </div>

      {/* Top destinations */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <ArrowUpRight className="w-3 h-3 text-danger" /> Top Destinations
        </h3>
        <div className="space-y-1.5">
          {data.topDestinations.slice(0, 8).map((d) => (
            <button
              key={d.address}
              onClick={() => onInvestigate(d.address)}
              className="w-full text-left hover:bg-accent/30 rounded-md transition-colors"
            >
              <FlowBar
                label={shortenAddress(d.address)}
                value={d.volumeOut}
                maxValue={maxDestVol}
                color="bg-danger"
              />
            </button>
          ))}
          {data.topDestinations.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">No outflows detected</p>
          )}
        </div>
      </div>
    </div>
  );
}
