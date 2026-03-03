/** Wallet Relationship View (light version)
 *  Shows repeated counterparties, clustering hints, and interaction frequency
 *  from case evidence data. */

import { useMemo } from "react";
import { Users, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import type { CaseItem } from "@/lib/case.types";

interface Props {
  items: CaseItem[];
}

interface RelationshipHint {
  address: string;
  interactionCount: number;
  direction: "in" | "out" | "both";
  label?: string;
}

export default function WalletRelationships({ items }: Props) {
  const { lang } = useI18n();

  const relationships = useMemo(() => {
    const walletAddrs = new Set(
      items.filter(i => i.item_type === "wallet").map(i => i.ref.toLowerCase())
    );
    const txs = items.filter(i => i.item_type === "tx");

    const counterMap = new Map<string, { inCount: number; outCount: number }>();

    for (const tx of txs) {
      const d = tx.data as Record<string, unknown>;
      const from = String(d.from_address ?? "").toLowerCase();
      const to = String(d.to_address ?? "").toLowerCase();

      // Track counterparties relative to case wallets
      if (walletAddrs.has(from) && to) {
        const entry = counterMap.get(to) ?? { inCount: 0, outCount: 0 };
        entry.outCount++;
        counterMap.set(to, entry);
      }
      if (walletAddrs.has(to) && from) {
        const entry = counterMap.get(from) ?? { inCount: 0, outCount: 0 };
        entry.inCount++;
        counterMap.set(from, entry);
      }
    }

    // Remove self-references
    for (const addr of walletAddrs) counterMap.delete(addr);

    const hints: RelationshipHint[] = [];
    counterMap.forEach((counts, address) => {
      const total = counts.inCount + counts.outCount;
      if (total < 1) return;
      hints.push({
        address,
        interactionCount: total,
        direction: counts.inCount > 0 && counts.outCount > 0 ? "both" :
          counts.inCount > 0 ? "in" : "out",
      });
    });

    hints.sort((a, b) => b.interactionCount - a.interactionCount);
    return hints.slice(0, 20);
  }, [items]);

  if (relationships.length === 0) {
    return (
      <div className="text-center py-6">
        <Users className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">
          {lang === "fr"
            ? "Aucune relation de wallet détectée dans les preuves. Ajoutez des wallets et transactions."
            : "No wallet relationships detected in evidence. Add wallets and transactions."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <Link2 className="w-3.5 h-3.5 text-primary" />
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
          {lang === "fr" ? "Contreparties répétées" : "Repeated Counterparties"}
          {" "}({relationships.length})
        </p>
      </div>

      <div className="space-y-1.5">
        {relationships.map(rel => (
          <div key={rel.address} className="gradient-card rounded-lg p-2.5 flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-mono truncate">{rel.address}</p>
            </div>
            <Badge
              variant="outline"
              className={`text-[8px] ${
                rel.direction === "both" ? "bg-primary/10 text-primary border-primary/30" :
                rel.direction === "in" ? "bg-success/10 text-success border-success/30" :
                "bg-danger/10 text-danger border-danger/30"
              }`}
            >
              {rel.direction === "both" ? "↔" : rel.direction === "in" ? "↓" : "↑"}
            </Badge>
            <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
              ×{rel.interactionCount}
            </span>
          </div>
        ))}
      </div>

      {/* Confidence disclaimer */}
      <p className="text-[9px] text-muted-foreground">
        {lang === "fr"
          ? "⚠ Confiance limitée — basée uniquement sur les preuves du dossier, pas sur un scan complet."
          : "⚠ Limited confidence — based only on case evidence, not a full scan."}
      </p>
    </div>
  );
}
