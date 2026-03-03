/** Investigation Mode — Transaction Explorer with filters.
 *  Renders only case evidence items of type "tx" with filtering. */

import { useState, useMemo } from "react";
import { Search, ArrowDownUp, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import type { CaseItem } from "@/lib/case.types";

interface Props {
  items: CaseItem[];
  onBookmark?: (item: CaseItem) => void;
}

export default function TransactionExplorer({ items, onBookmark }: Props) {
  const { lang } = useI18n();
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState<"all" | "in" | "out">("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");

  const txItems = useMemo(() => {
    let filtered = items.filter(i => i.item_type === "tx");

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        i => i.ref.toLowerCase().includes(q) ||
          (i.title ?? "").toLowerCase().includes(q) ||
          String(i.data?.token_symbol ?? "").toLowerCase().includes(q)
      );
    }

    if (direction !== "all") {
      filtered = filtered.filter(i => String(i.data?.direction ?? "") === direction);
    }

    filtered.sort((a, b) => {
      if (sortBy === "amount") {
        return Number(b.data?.value_native ?? 0) - Number(a.data?.value_native ?? 0);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return filtered;
  }, [items, search, direction, sortBy]);

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder={lang === "fr" ? "Hash, token, label..." : "Hash, token, label..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="text-xs pl-7 h-8"
          />
        </div>
        <Select value={direction} onValueChange={v => setDirection(v as "all" | "in" | "out")}>
          <SelectTrigger className="w-20 h-8 text-[10px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang === "fr" ? "Tous" : "All"}</SelectItem>
            <SelectItem value="in">{lang === "fr" ? "Entrant" : "In"}</SelectItem>
            <SelectItem value="out">{lang === "fr" ? "Sortant" : "Out"}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={v => setSortBy(v as "date" | "amount")}>
          <SelectTrigger className="w-24 h-8 text-[10px]">
            <ArrowDownUp className="w-3 h-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">{lang === "fr" ? "Date" : "Date"}</SelectItem>
            <SelectItem value="amount">{lang === "fr" ? "Montant" : "Amount"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {txItems.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">
          {lang === "fr"
            ? "Aucune transaction correspondante dans ce dossier."
            : "No matching transactions in this case."}
        </p>
      ) : (
        <div className="space-y-1.5">
          {txItems.map(tx => {
            const d = tx.data as Record<string, unknown>;
            const dir = String(d.direction ?? "");
            return (
              <div
                key={tx.id}
                className="gradient-card rounded-lg p-2.5 flex items-center gap-2"
              >
                <Badge
                  variant="outline"
                  className={`text-[8px] shrink-0 ${
                    dir === "in" ? "bg-success/10 text-success border-success/30" :
                    dir === "out" ? "bg-danger/10 text-danger border-danger/30" :
                    ""
                  }`}
                >
                  {dir === "in" ? "IN" : dir === "out" ? "OUT" : "TX"}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-mono truncate">{tx.ref}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {d.value_native !== undefined && (
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {Number(d.value_native).toLocaleString()} {String(d.token_symbol ?? "CRO")}
                      </span>
                    )}
                    {tx.title && (
                      <span className="text-[10px] text-muted-foreground truncate">
                        {tx.title}
                      </span>
                    )}
                  </div>
                </div>
                {onBookmark && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                    onClick={() => onBookmark(tx)}
                    title={lang === "fr" ? "Marquer comme preuve" : "Bookmark as evidence"}
                  >
                    📌
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
