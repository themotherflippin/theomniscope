import { useState } from "react";
import { Copy, CheckCircle, ExternalLink, Search as SearchIcon } from "lucide-react";
import { shortenAddress } from "@/lib/formatters";
import type { TokenHolder } from "@/lib/tokenIntel.types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Props {
  holders: TokenHolder[];
  loading: boolean;
  estimated: boolean;
  onInvestigate: (address: string) => void;
}

export default function HolderTable({
  holders,
  loading,
  estimated,
  onInvestigate,
}: Props) {
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddr(addr);
    setTimeout(() => setCopiedAddr(null), 1500);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-lg" />
        ))}
      </div>
    );
  }

  if (holders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <SearchIcon className="w-8 h-8 text-muted-foreground opacity-40" />
        <p className="text-sm text-muted-foreground">No holder data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {estimated && (
        <Badge variant="outline" className="text-[10px] text-warning border-warning/30">
          ⚠ Estimated from transfers
        </Badge>
      )}

      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground text-[10px] uppercase border-b border-border/50">
              <th className="text-left py-2 px-2 font-medium">#</th>
              <th className="text-left py-2 px-2 font-medium">Address</th>
              <th className="text-right py-2 px-2 font-medium">Balance</th>
              <th className="text-right py-2 px-2 font-medium">% Supply</th>
              <th className="text-center py-2 px-1 font-medium w-8"></th>
            </tr>
          </thead>
          <tbody>
            {holders.map((holder, idx) => (
              <tr
                key={holder.address}
                className="border-b border-border/20 hover:bg-accent/30 transition-colors"
              >
                <td className="py-2 px-2 font-mono text-muted-foreground">
                  {idx + 1}
                </td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono">
                      {shortenAddress(holder.address)}
                    </span>
                    <button
                      onClick={() => copyAddress(holder.address)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copiedAddr === holder.address ? (
                        <CheckCircle className="w-3 h-3 text-success" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="py-2 px-2 text-right font-mono">
                  {parseFloat(holder.balanceFormatted).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="py-2 px-2 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <div className="w-12 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${Math.min(100, holder.pctOfSupply)}%`,
                        }}
                      />
                    </div>
                    <span className="font-mono w-12 text-right">
                      {holder.pctOfSupply.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="py-2 px-1 text-center">
                  <button
                    onClick={() => onInvestigate(holder.address)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    title="Investigate wallet"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
