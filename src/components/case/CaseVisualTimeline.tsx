import { useMemo } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import type { TimelineEntry } from "@/lib/case.types";

const TYPE_COLORS: Record<string, string> = {
  case_created: "bg-primary",
  wallet: "bg-chart-cyan",
  token: "bg-success",
  tx: "bg-warning",
  cluster: "bg-primary",
  alert: "bg-danger",
  note: "bg-muted-foreground",
  snapshot: "bg-chart-blue",
};

const TYPE_ICONS: Record<string, string> = {
  case_created: "📂",
  wallet: "👛",
  token: "🪙",
  tx: "📝",
  cluster: "🔗",
  alert: "🚨",
  note: "📌",
  snapshot: "📸",
};

interface Props {
  timeline: TimelineEntry[];
  isLoading?: boolean;
}

export function CaseVisualTimeline({ timeline, isLoading }: Props) {
  const { lang } = useI18n();

  const grouped = useMemo(() => {
    if (!timeline.length) return [];
    const groups: { date: string; entries: TimelineEntry[] }[] = [];
    let currentDate = "";

    for (const entry of timeline) {
      const d = new Date(entry.time).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      if (d !== currentDate) {
        currentDate = d;
        groups.push({ date: d, entries: [] });
      }
      groups[groups.length - 1].entries.push(entry);
    }
    return groups;
  }, [timeline, lang]);

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-8">
        {lang === "fr" ? "Aucun événement" : "No timeline events"}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map((group, gi) => (
        <div key={group.date}>
          {/* Date header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2">
              {group.date}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Entries */}
          <div className="relative pl-8 space-y-3">
            {/* Vertical line */}
            <div className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-border to-transparent" />

            {group.entries.map((entry, i) => {
              const dotColor = TYPE_COLORS[entry.type] ?? "bg-muted-foreground";
              const icon = TYPE_ICONS[entry.type] ?? "📎";
              const globalIndex = gi * 100 + i;

              return (
                <motion.div
                  key={globalIndex}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="relative"
                >
                  {/* Dot */}
                  <div
                    className={`absolute -left-[22px] top-2 w-3 h-3 rounded-full ${dotColor} border-2 border-background shadow-sm`}
                  />

                  {/* Card */}
                  <div className="gradient-card rounded-lg p-3 hover:border-primary/20 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{icon}</span>
                      <Badge variant="outline" className="text-[8px] px-1.5 py-0">
                        {entry.type === "case_created"
                          ? lang === "fr" ? "Création" : "Created"
                          : entry.type}
                      </Badge>
                      <span className="text-[9px] text-muted-foreground ml-auto">
                        {new Date(entry.time).toLocaleTimeString(
                          lang === "fr" ? "fr-FR" : "en-US",
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </span>
                    </div>
                    <p className="text-xs font-medium">{entry.title}</p>
                    {entry.details && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                        {entry.details}
                      </p>
                    )}
                    {entry.evidenceRefs?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {entry.evidenceRefs.map((ref, ri) => (
                          <span
                            key={ri}
                            className="text-[8px] font-mono bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground truncate max-w-[120px]"
                          >
                            {ref}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
