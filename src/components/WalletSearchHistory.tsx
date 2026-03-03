import { Clock, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WalletHistoryEntry } from "@/hooks/useWalletSearchHistory";

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function timeAgo(ts: number) {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}j`;
}

interface Props {
  history: WalletHistoryEntry[];
  onSelect: (address: string) => void;
  onRemove: (address: string) => void;
  onClear: () => void;
}

export default function WalletSearchHistory({ history, onSelect, onRemove, onClear }: Props) {
  if (history.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          Historique des recherches
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] text-muted-foreground hover:text-destructive gap-1 px-2"
          onClick={onClear}
        >
          <Trash2 className="w-3 h-3" />
          Effacer
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {history.map((entry) => (
          <button
            key={entry.address}
            onClick={() => onSelect(entry.address)}
            className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-accent/40 hover:bg-primary/15 border border-border/40 hover:border-primary/30 transition-colors text-[10px] font-mono"
          >
            <span className="text-foreground">{truncate(entry.address)}</span>
            <span className="text-muted-foreground/60">{timeAgo(entry.lastUsed)}</span>
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(entry.address);
              }}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity ml-0.5"
            >
              <X className="w-3 h-3" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
