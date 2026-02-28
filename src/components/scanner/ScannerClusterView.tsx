import { motion } from "framer-motion";
import { Network, ExternalLink, Copy, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { shortenAddress } from "@/lib/formatters";
import type { WalletScanResult, ClusterNode } from "@/lib/walletScanner.types";
import { useState } from "react";

const ROLE_STYLES: Record<string, string> = {
  seed: "bg-primary/20 text-primary border-primary/40",
  core: "bg-danger/15 text-danger border-danger/30",
  associated: "bg-warning/15 text-warning border-warning/30",
  peripheral: "bg-muted text-muted-foreground border-border",
};

const STRENGTH_COLORS: Record<string, string> = {
  strong: "bg-danger",
  medium: "bg-warning",
  weak: "bg-muted-foreground/30",
};

function ClusterNodeCard({
  node,
  onInvestigate,
}: {
  node: ClusterNode;
  onInvestigate: (addr: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(node.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="gradient-card rounded-lg p-3 flex items-center gap-2"
    >
      <Badge variant="outline" className={`text-[8px] px-1.5 shrink-0 ${ROLE_STYLES[node.role]}`}>
        {node.role}
      </Badge>

      <button
        onClick={() => onInvestigate(node.address)}
        className="text-xs font-mono font-semibold text-primary hover:underline truncate flex-1 text-left"
      >
        {shortenAddress(node.address)}
      </button>

      <span className="text-[10px] font-mono text-muted-foreground tabular-nums shrink-0">
        {node.linkScore.toFixed(0)}
      </span>

      <span className="text-[9px] text-muted-foreground shrink-0">D{node.depth}</span>

      <div className="flex items-center gap-1 shrink-0">
        <button onClick={copy} className="text-muted-foreground hover:text-foreground">
          {copied ? <CheckCircle className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
        </button>
        <a
          href={`https://cronoscan.com/address/${node.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </motion.div>
  );
}

interface ScannerClusterViewProps {
  data: WalletScanResult;
  onInvestigate: (addr: string) => void;
}

export default function ScannerClusterView({ data, onInvestigate }: ScannerClusterViewProps) {
  const coreNodes = data.cluster.filter((n) => n.role === "seed" || n.role === "core");
  const associatedNodes = data.cluster.filter((n) => n.role === "associated");
  const peripheralNodes = data.cluster.filter((n) => n.role === "peripheral");

  const strongEdges = data.clusterEdges.filter((e) => e.strength === "strong").length;
  const mediumEdges = data.clusterEdges.filter((e) => e.strength === "medium").length;

  return (
    <div className="space-y-4">
      {/* Cluster stats */}
      <div className="gradient-card rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Network className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-display font-semibold">Wallet Cluster</h3>
          <Badge variant="outline" className="text-[9px] ml-auto">
            {data.cluster.length} nodes · {data.clusterEdges.length} edges
          </Badge>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-lg bg-primary/10 p-2 text-center">
            <p className="text-lg font-mono font-bold tabular-nums">{coreNodes.length}</p>
            <p className="text-[8px] text-muted-foreground">Core</p>
          </div>
          <div className="rounded-lg bg-warning/10 p-2 text-center">
            <p className="text-lg font-mono font-bold tabular-nums">{associatedNodes.length}</p>
            <p className="text-[8px] text-muted-foreground">Associated</p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-2 text-center">
            <p className="text-lg font-mono font-bold tabular-nums">{peripheralNodes.length}</p>
            <p className="text-[8px] text-muted-foreground">Peripheral</p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-2 text-center">
            <p className="text-lg font-mono font-bold tabular-nums">{strongEdges}</p>
            <p className="text-[8px] text-muted-foreground">Strong Links</p>
          </div>
        </div>
      </div>

      {/* Edge strength legend */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground px-1">
        <span className="font-medium">Edge strength:</span>
        {(["strong", "medium", "weak"] as const).map((s) => (
          <span key={s} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${STRENGTH_COLORS[s]}`} />
            {s} ({data.clusterEdges.filter((e) => e.strength === s).length})
          </span>
        ))}
      </div>

      {/* Core nodes */}
      {coreNodes.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Core Wallets
          </h4>
          {coreNodes.map((node) => (
            <ClusterNodeCard key={node.address} node={node} onInvestigate={onInvestigate} />
          ))}
        </div>
      )}

      {/* Associated nodes */}
      {associatedNodes.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Associated Wallets
          </h4>
          <div className="max-h-[300px] overflow-y-auto scrollbar-thin space-y-1">
            {associatedNodes.map((node) => (
              <ClusterNodeCard key={node.address} node={node} onInvestigate={onInvestigate} />
            ))}
          </div>
        </div>
      )}

      {/* Peripheral nodes */}
      {peripheralNodes.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Peripheral Wallets
          </h4>
          <div className="max-h-[200px] overflow-y-auto scrollbar-thin space-y-1">
            {peripheralNodes.map((node) => (
              <ClusterNodeCard key={node.address} node={node} onInvestigate={onInvestigate} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
