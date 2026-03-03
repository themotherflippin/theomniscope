import { Info, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type ProvenanceStatus = "ok" | "degraded" | "unavailable";

export interface ProvenanceInfo {
  source: string;
  updatedAt: number | null;
  status: ProvenanceStatus;
  rejectedCount?: number;
}

const STATUS_ICONS: Record<ProvenanceStatus, typeof CheckCircle> = {
  ok: CheckCircle,
  degraded: AlertTriangle,
  unavailable: AlertTriangle,
};

const STATUS_COLORS: Record<ProvenanceStatus, string> = {
  ok: "text-success",
  degraded: "text-warning",
  unavailable: "text-danger",
};

function formatTimeAgo(ts: number, lang: string): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return lang === "fr" ? `il y a ${diff}s` : `${diff}s ago`;
  if (diff < 3600) return lang === "fr" ? `il y a ${Math.floor(diff / 60)}m` : `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return lang === "fr" ? `il y a ${Math.floor(diff / 3600)}h` : `${Math.floor(diff / 3600)}h ago`;
  return lang === "fr" ? `il y a ${Math.floor(diff / 86400)}j` : `${Math.floor(diff / 86400)}d ago`;
}

export function DataProvenanceBadge({
  provenance,
  compact = true,
  onRetry,
}: {
  provenance: ProvenanceInfo;
  compact?: boolean;
  onRetry?: () => void;
}) {
  const { lang } = useI18n();
  const StatusIcon = STATUS_ICONS[provenance.status];
  const color = STATUS_COLORS[provenance.status];

  const statusLabel =
    provenance.status === "ok"
      ? "OK"
      : provenance.status === "degraded"
        ? lang === "fr" ? "Dégradé" : "Degraded"
        : lang === "fr" ? "Indisponible" : "Unavailable";

  const tooltipContent = (
    <div className="space-y-1 text-[10px]">
      <div className="flex items-center gap-1.5">
        <StatusIcon className={`w-3 h-3 ${color}`} />
        <span className="font-semibold">{statusLabel}</span>
      </div>
      <div>
        <span className="text-muted-foreground">Source: </span>
        <span className="font-mono">{provenance.source}</span>
      </div>
      {provenance.updatedAt && (
        <div>
          <span className="text-muted-foreground">
            {lang === "fr" ? "Mis à jour: " : "Updated: "}
          </span>
          <span>{formatTimeAgo(provenance.updatedAt, lang)}</span>
        </div>
      )}
      {provenance.rejectedCount !== undefined && provenance.rejectedCount > 0 && (
        <div className="text-warning">
          {lang === "fr"
            ? `${provenance.rejectedCount} entrée(s) rejetée(s)`
            : `${provenance.rejectedCount} item(s) rejected`}
        </div>
      )}
      {provenance.status === "unavailable" && onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 text-primary hover:underline mt-1"
        >
          <RefreshCw className="w-2.5 h-2.5" />
          {lang === "fr" ? "Réessayer" : "Retry"}
        </button>
      )}
    </div>
  );

  if (compact) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="flex items-center gap-1 text-[8px] text-muted-foreground hover:text-foreground transition-colors">
              <StatusIcon className={`w-2.5 h-2.5 ${color}`} />
              <span className="font-mono truncate max-w-[60px]">
                {provenance.source.split(",")[0]}
              </span>
              {provenance.updatedAt && (
                <span className="opacity-60">
                  · {formatTimeAgo(provenance.updatedAt, lang)}
                </span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 text-[9px]">
      <StatusIcon className={`w-3 h-3 ${color}`} />
      <span className="text-muted-foreground">{provenance.source}</span>
      {provenance.updatedAt && (
        <span className="text-muted-foreground opacity-60">
          · {formatTimeAgo(provenance.updatedAt, lang)}
        </span>
      )}
      {provenance.status === "unavailable" && onRetry && (
        <button onClick={onRetry} className="text-primary hover:underline ml-auto">
          <RefreshCw className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
}

/** Helper: tooltip for explaining a metric */
export function MetricTooltip({
  labelKey,
  children,
}: {
  labelKey: string;
  children: React.ReactNode;
}) {
  const { lang } = useI18n();
  const tooltip = METRIC_TOOLTIPS[labelKey];

  if (!tooltip) return <>{children}</>;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-0.5 cursor-help">
            {children}
            <Info className="w-2.5 h-2.5 text-muted-foreground/50 shrink-0" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[250px] text-[10px] space-y-1">
          <p className="font-semibold">{tooltip.title[lang]}</p>
          <p className="text-muted-foreground">{tooltip.description[lang]}</p>
          {tooltip.formula && (
            <p className="font-mono text-[9px] text-primary/80">{tooltip.formula[lang]}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ---- Metric Tooltips Registry (FR/EN) ----

interface TooltipDef {
  title: { en: string; fr: string };
  description: { en: string; fr: string };
  formula?: { en: string; fr: string };
}

const METRIC_TOOLTIPS: Record<string, TooltipDef> = {
  marketCap: {
    title: { en: "Market Capitalization", fr: "Capitalisation de marché" },
    description: {
      en: "Total value of all tokens in circulation. Aggregated from tracked tokens.",
      fr: "Valeur totale de tous les tokens en circulation. Agrégée à partir des tokens suivis.",
    },
    formula: {
      en: "Sum of (price × circulating supply) for each token",
      fr: "Somme de (prix × offre en circulation) pour chaque token",
    },
  },
  priceChange24h: {
    title: { en: "24h Price Change", fr: "Variation de prix 24h" },
    description: {
      en: "Average price movement over the last 24 hours across all tracked tokens.",
      fr: "Variation moyenne des prix sur les dernières 24 heures pour tous les tokens suivis.",
    },
    formula: {
      en: "Average of individual 24h % changes",
      fr: "Moyenne des variations individuelles sur 24h",
    },
  },
  riskScore: {
    title: { en: "Risk Score", fr: "Score de risque" },
    description: {
      en: "Composite score (0-100) based on liquidity, concentration, contract age, and on-chain patterns. Higher = more risk.",
      fr: "Score composite (0-100) basé sur la liquidité, la concentration, l'âge du contrat et les patterns on-chain. Plus élevé = plus risqué.",
    },
    formula: {
      en: "Weighted sum: liquidity(30%) + concentration(25%) + age(20%) + patterns(25%)",
      fr: "Somme pondérée : liquidité(30%) + concentration(25%) + âge(20%) + patterns(25%)",
    },
  },
  confidenceScore: {
    title: { en: "Confidence Score", fr: "Score de confiance" },
    description: {
      en: "How confident the analysis is in its findings. Based on data availability and consistency. Does NOT indicate safety.",
      fr: "Degré de confiance de l'analyse dans ses résultats. Basé sur la disponibilité et cohérence des données. N'indique PAS la sécurité.",
    },
  },
  smartMoney: {
    title: { en: "Smart Money", fr: "Smart Money" },
    description: {
      en: "Wallets identified as historically profitable traders via on-chain heuristics. Not guaranteed to be accurate.",
      fr: "Wallets identifiés comme traders historiquement rentables via des heuristiques on-chain. Précision non garantie.",
    },
  },
  whaleAlert: {
    title: { en: "Whale Alert", fr: "Alerte Whale" },
    description: {
      en: "Triggered when a large transfer exceeds $50,000 USD equivalent. Source: on-chain monitoring.",
      fr: "Déclenchée quand un transfert important dépasse 50 000$ USD équivalent. Source : monitoring on-chain.",
    },
  },
  pnl: {
    title: { en: "PnL (Profit & Loss)", fr: "PnL (Profit & Pertes)" },
    description: {
      en: "Estimated profit or loss based on buy/sell transactions tracked on-chain. May not include all positions.",
      fr: "Profit ou perte estimé basé sur les transactions d'achat/vente on-chain. Peut ne pas inclure toutes les positions.",
    },
    formula: {
      en: "Current value - cost basis (from tracked trades)",
      fr: "Valeur actuelle - coût de base (depuis les trades suivis)",
    },
  },
  caseStatus: {
    title: { en: "Case Status", fr: "Statut du dossier" },
    description: {
      en: "Open: active investigation. Triaged: reviewed and prioritized. Closed: investigation complete.",
      fr: "Ouvert : enquête active. Trié : examiné et priorisé. Fermé : enquête terminée.",
    },
  },
  casePriority: {
    title: { en: "Case Priority", fr: "Priorité du dossier" },
    description: {
      en: "Critical: immediate action needed. High: urgent review. Medium: standard. Low: informational.",
      fr: "Critique : action immédiate requise. Haute : revue urgente. Moyenne : standard. Basse : informationnel.",
    },
  },
  evidenceItem: {
    title: { en: "Evidence Item", fr: "Élément de preuve" },
    description: {
      en: "A piece of on-chain data linked to the investigation: wallet address, transaction hash, token contract, or cluster analysis.",
      fr: "Une donnée on-chain liée à l'investigation : adresse wallet, hash de transaction, contrat token, ou analyse de cluster.",
    },
  },
  timeline: {
    title: { en: "Timeline", fr: "Chronologie" },
    description: {
      en: "Chronological sequence of all events in this case: evidence additions, notes, and status changes.",
      fr: "Séquence chronologique de tous les événements du dossier : ajouts de preuves, notes et changements de statut.",
    },
  },
};
