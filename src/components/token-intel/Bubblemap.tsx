import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ExternalLink,
  Eye,
  Tag,
  Filter,
  Copy,
  CheckCircle,
} from "lucide-react";
import { shortenAddress } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { BubblemapNode, BubblemapEdge, BubblemapSignals } from "@/lib/tokenIntel.types";

interface Props {
  nodes: BubblemapNode[];
  edges: BubblemapEdge[];
  signals: BubblemapSignals;
  loading: boolean;
  onInvestigate: (address: string) => void;
}

interface LayoutNode extends BubblemapNode {
  x: number;
  y: number;
  radius: number;
}

const TAG_COLORS: Record<string, string> = {
  fresh: "bg-warning/20 text-warning border-warning/30",
  contract: "bg-primary/20 text-primary border-primary/30",
  lp: "bg-success/20 text-success border-success/30",
};

function computeLayout(
  nodes: BubblemapNode[],
  width: number,
  height: number
): LayoutNode[] {
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.min(width, height) * 0.38;

  // Size-based radii
  const maxPct = Math.max(...nodes.map((n) => n.pctOfSupply), 1);

  return nodes.map((node, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    const distFromCenter = maxRadius * (0.4 + 0.6 * (1 - node.pctOfSupply / maxPct));
    const radius = Math.max(6, Math.min(28, (node.pctOfSupply / maxPct) * 28));

    return {
      ...node,
      x: cx + Math.cos(angle) * distFromCenter,
      y: cy + Math.sin(angle) * distFromCenter,
      radius,
    };
  });
}

export default function Bubblemap({
  nodes,
  edges,
  signals,
  loading,
  onInvestigate,
}: Props) {
  const [selectedNode, setSelectedNode] = useState<LayoutNode | null>(null);
  const [copied, setCopied] = useState(false);
  const [filters, setFilters] = useState({
    showContracts: true,
    showLP: true,
    showFresh: true,
  });
  const [showFilters, setShowFilters] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ w: 320, h: 320 });

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const w = entry.contentRect.width;
        setDimensions({ w, h: Math.min(w, 400) });
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      if (!filters.showContracts && n.tags.includes("contract")) return false;
      if (!filters.showLP && n.tags.includes("lp")) return false;
      if (!filters.showFresh && n.tags.includes("fresh")) return false;
      return true;
    });
  }, [nodes, filters]);

  const layoutNodes = useMemo(
    () => computeLayout(filteredNodes, dimensions.w, dimensions.h),
    [filteredNodes, dimensions]
  );

  const nodeMap = useMemo(() => {
    const map = new Map<string, LayoutNode>();
    for (const n of layoutNodes) map.set(n.id, n);
    return map;
  }, [layoutNodes]);

  const maxEdgeWeight = useMemo(
    () => Math.max(...edges.map((e) => e.txCount), 1),
    [edges]
  );

  const copyAddr = useCallback((addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, []);

  if (loading) {
    return <Skeleton className="w-full h-64 rounded-xl" />;
  }

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 gradient-card rounded-xl">
        <Eye className="w-8 h-8 text-muted-foreground opacity-40" />
        <p className="text-sm text-muted-foreground">
          No holder graph data available
        </p>
      </div>
    );
  }

  return (
    <div className="gradient-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          <span className="text-sm font-display font-semibold">Holder Bubblemap</span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {layoutNodes.length} nodes · {edges.length} edges
          </span>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border/50"
          >
            <div className="p-2 flex flex-wrap gap-2">
              {(["showContracts", "showLP", "showFresh"] as const).map((key) => {
                const labels = {
                  showContracts: "Contracts",
                  showLP: "LP Nodes",
                  showFresh: "Fresh Wallets",
                };
                return (
                  <button
                    key={key}
                    onClick={() =>
                      setFilters((f) => ({ ...f, [key]: !f[key] }))
                    }
                    className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                      filters[key]
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-muted border-border text-muted-foreground"
                    }`}
                  >
                    {labels[key]}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Graph */}
      <div ref={containerRef} className="relative touch-manipulation">
        <svg
          width={dimensions.w}
          height={dimensions.h}
          viewBox={`0 0 ${dimensions.w} ${dimensions.h}`}
          className="w-full"
        >
          {/* Edges */}
          {edges.map((edge, i) => {
            const src = nodeMap.get(edge.source);
            const tgt = nodeMap.get(edge.target);
            if (!src || !tgt) return null;
            const opacity = 0.15 + (edge.txCount / maxEdgeWeight) * 0.5;
            const strokeWidth = 0.5 + (edge.txCount / maxEdgeWeight) * 2.5;
            return (
              <line
                key={i}
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke="hsl(var(--primary))"
                strokeOpacity={opacity}
                strokeWidth={strokeWidth}
              />
            );
          })}

          {/* Nodes */}
          {layoutNodes.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            const fillColor = node.tags.includes("fresh")
              ? "hsl(var(--warning))"
              : node.tags.includes("lp")
                ? "hsl(var(--success))"
                : node.tags.includes("contract")
                  ? "hsl(var(--primary))"
                  : "hsl(var(--primary))";

            return (
              <g
                key={node.id}
                onClick={() => setSelectedNode(isSelected ? null : node)}
                className="cursor-pointer"
              >
                {isSelected && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.radius + 4}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    opacity={0.6}
                  />
                )}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.radius}
                  fill={fillColor}
                  fillOpacity={isSelected ? 0.9 : 0.6}
                  stroke={isSelected ? "hsl(var(--foreground))" : "none"}
                  strokeWidth={1}
                />
                {node.radius > 14 && (
                  <text
                    x={node.x}
                    y={node.y + 3}
                    textAnchor="middle"
                    fill="hsl(var(--foreground))"
                    fontSize={8}
                    fontFamily="monospace"
                    pointerEvents="none"
                  >
                    {node.pctOfSupply.toFixed(1)}%
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Node detail panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="border-t border-border/50 p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-medium">
                  {shortenAddress(selectedNode.id)}
                </span>
                <button
                  onClick={() => copyAddr(selectedNode.id)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? (
                    <CheckCircle className="w-3 h-3 text-success" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-muted-foreground">
                {selectedNode.pctOfSupply.toFixed(2)}% of supply
              </span>
              {selectedNode.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={`text-[9px] px-1.5 py-0 ${TAG_COLORS[tag] ?? ""}`}
                >
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onInvestigate(selectedNode.id)}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Investigate
              </button>
              <button className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <Tag className="w-3 h-3" />
                Label
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Signals summary */}
      {(signals.loopsDetected ||
        signals.freshWallets.length > 0 ||
        signals.lpNodes.length > 0) && (
        <div className="border-t border-border/50 p-2 flex flex-wrap gap-1.5">
          {signals.loopsDetected && (
            <Badge
              variant="outline"
              className="text-[9px] text-warning border-warning/30"
            >
              ⟳ Loop detected
            </Badge>
          )}
          {signals.freshWallets.length > 0 && (
            <Badge
              variant="outline"
              className="text-[9px] text-warning border-warning/30"
            >
              🆕 {signals.freshWallets.length} fresh wallet(s)
            </Badge>
          )}
          {signals.lpNodes.length > 0 && (
            <Badge
              variant="outline"
              className="text-[9px] text-success border-success/30"
            >
              💧 {signals.lpNodes.length} LP node(s)
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
