import { useState } from "react";
import { motion } from "framer-motion";
import {
  ExternalLink,
  Copy,
  CheckCircle,
  ArrowLeftRight,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { shortenAddress, timeAgo } from "@/lib/formatters";
import type { CounterpartyResult } from "@/lib/walletScanner.types";

const STRENGTH_STYLES: Record<string, string> = {
  strong: "bg-danger/15 text-danger border-danger/30",
  medium: "bg-warning/15 text-warning border-warning/30",
  weak: "bg-muted text-muted-foreground border-border",
};

function CounterpartyRow({
  cp,
  onInvestigate,
}: {
  cp: CounterpartyResult;
  onInvestigate: (addr: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyAddr = () => {
    navigator.clipboard.writeText(cp.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const totalVolume = cp.volumeIn + cp.volumeOut;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="gradient-card rounded-lg p-3 space-y-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onInvestigate(cp.address)}
            className="text-xs font-mono font-semibold text-primary hover:underline"
          >
            {shortenAddress(cp.address)}
          </button>
          <button onClick={copyAddr} className="text-muted-foreground hover:text-foreground">
            {copied ? <CheckCircle className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
          </button>
          {cp.isContract && (
            <Badge variant="outline" className="text-[8px] px-1">Contract</Badge>
          )}
        </div>
        <Badge variant="outline" className={`text-[9px] ${STRENGTH_STYLES[cp.linkStrength]}`}>
          {cp.linkStrength} · {cp.linkScore}
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <div>
          <p className="text-xs font-mono font-bold tabular-nums">{cp.txCount}</p>
          <p className="text-[8px] text-muted-foreground">Tx</p>
        </div>
        <div>
          <p className="text-xs font-mono font-bold tabular-nums text-success">
            {cp.volumeIn > 0 ? cp.volumeIn.toFixed(2) : "—"}
          </p>
          <p className="text-[8px] text-muted-foreground">In</p>
        </div>
        <div>
          <p className="text-xs font-mono font-bold tabular-nums text-danger">
            {cp.volumeOut > 0 ? cp.volumeOut.toFixed(2) : "—"}
          </p>
          <p className="text-[8px] text-muted-foreground">Out</p>
        </div>
        <div>
          <p className="text-xs font-mono font-bold tabular-nums">{cp.tokenDiversity}</p>
          <p className="text-[8px] text-muted-foreground">Tokens</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>
          {cp.lastSeen ? `Last: ${timeAgo(new Date(cp.lastSeen).getTime())}` : "—"}
        </span>
        <div className="flex items-center gap-2">
          {cp.bidirectional && (
            <span className="flex items-center gap-0.5 text-primary">
              <ArrowLeftRight className="w-3 h-3" /> Bidirectional
            </span>
          )}
          <a
            href={`https://cronoscan.com/address/${cp.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

interface CounterpartiesListProps {
  counterparties: CounterpartyResult[];
  onInvestigate: (addr: string) => void;
}

export default function CounterpartiesList({
  counterparties,
  onInvestigate,
}: CounterpartiesListProps) {
  const [filter, setFilter] = useState<"all" | "strong" | "medium" | "weak">("all");

  const filtered =
    filter === "all"
      ? counterparties
      : counterparties.filter((cp) => cp.linkStrength === filter);

  const counts = {
    strong: counterparties.filter((cp) => cp.linkStrength === "strong").length,
    medium: counterparties.filter((cp) => cp.linkStrength === "medium").length,
    weak: counterparties.filter((cp) => cp.linkStrength === "weak").length,
  };

  return (
    <div className="space-y-3">
      {/* Filter chips */}
      <div className="flex gap-1.5 flex-wrap">
        {(["all", "strong", "medium", "weak"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-accent"
            }`}
          >
            {f === "all" ? `All (${counterparties.length})` : `${f} (${counts[f]})`}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-1.5 max-h-[500px] overflow-y-auto scrollbar-thin">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            No counterparties match this filter
          </p>
        ) : (
          filtered.map((cp) => (
            <CounterpartyRow key={cp.address} cp={cp} onInvestigate={onInvestigate} />
          ))
        )}
      </div>
    </div>
  );
}
