/** Risk Analysis Panel — renders risk score gauge, level badge,
 *  confidence indicator, and triggered risk factors for a Case. */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, ShieldCheck, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { computeRiskScore, type CaseRiskResult, type RiskFactorResult } from "@/lib/riskEngine";
import type { CaseItem } from "@/lib/case.types";

interface Props {
  items: CaseItem[];
  notes: Array<{ body: string }>;
}

function RiskGauge({ score, level }: { score: number; level: string }) {
  const rotation = (score / 100) * 180 - 90; // -90 to 90 degrees
  const color =
    level === "high" ? "hsl(var(--danger))" :
    level === "medium" ? "hsl(var(--warning))" :
    "hsl(var(--success))";

  return (
    <div className="relative w-32 h-16 mx-auto">
      {/* Background arc */}
      <svg viewBox="0 0 120 60" className="w-full h-full">
        <path
          d="M10 55 A50 50 0 0 1 110 55"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M10 55 A50 50 0 0 1 110 55"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 157} 157`}
          className="transition-all duration-1000"
        />
      </svg>
      {/* Score text */}
      <div className="absolute inset-0 flex items-end justify-center pb-0.5">
        <motion.span
          className="text-xl font-display font-bold tabular-nums"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ color }}
        >
          {score}
        </motion.span>
        <span className="text-[10px] text-muted-foreground ml-0.5 mb-0.5">/100</span>
      </div>
    </div>
  );
}

function FactorRow({ factor, lang }: { factor: RiskFactorResult; lang: "en" | "fr" }) {
  if (!factor.triggered) return null;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-2 p-2.5 rounded-lg bg-danger/5 border border-danger/15"
    >
      <AlertTriangle className="w-3.5 h-3.5 text-danger shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-xs font-medium">{factor.label[lang]}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{factor.description[lang]}</p>
      </div>
      <Badge variant="outline" className="text-[8px] shrink-0 border-danger/30 text-danger">
        +{factor.weight}
      </Badge>
    </motion.div>
  );
}

export default function RiskAnalysisPanel({ items, notes }: Props) {
  const { t, lang } = useI18n();

  const risk: CaseRiskResult = useMemo(() => {
    const input = {
      items: items.map(i => ({
        item_type: i.item_type,
        ref: i.ref,
        title: i.title,
        data: i.data as Record<string, unknown>,
      })),
      notes: notes.map(n => ({ body: n.body })),
    };
    return computeRiskScore(input);
  }, [items, notes]);

  const levelLabel = {
    low: { en: "Low Risk", fr: "Risque faible" },
    medium: { en: "Medium Risk", fr: "Risque moyen" },
    high: { en: "High Risk", fr: "Risque élevé" },
  };

  const confidenceLabel = {
    low: { en: "Low Confidence", fr: "Confiance faible" },
    medium: { en: "Medium Confidence", fr: "Confiance moyenne" },
    high: { en: "High Confidence", fr: "Confiance élevée" },
  };

  const LevelIcon = risk.riskLevel === "high" ? ShieldAlert :
    risk.riskLevel === "medium" ? AlertTriangle : ShieldCheck;

  const levelColor =
    risk.riskLevel === "high" ? "text-danger" :
    risk.riskLevel === "medium" ? "text-warning" : "text-success";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="gradient-card-elevated rounded-xl p-4 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <LevelIcon className={`w-4 h-4 ${levelColor}`} />
        <h3 className="text-sm font-display font-bold">
          {lang === "fr" ? "Analyse de Risque" : "Risk Analysis"}
        </h3>
      </div>

      {risk.insufficientData ? (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
          <Info className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            {lang === "fr"
              ? "Données insuffisantes — ajoutez des preuves pour obtenir une analyse de risque."
              : "Insufficient data — add evidence to generate a risk analysis."}
          </p>
        </div>
      ) : (
        <>
          {/* Gauge + badges */}
          <div className="flex flex-col items-center gap-2">
            <RiskGauge score={risk.riskScore} level={risk.riskLevel} />
            <div className="flex gap-2">
              <Badge
                variant="outline"
                className={`text-[9px] ${
                  risk.riskLevel === "high" ? "bg-danger/10 text-danger border-danger/30" :
                  risk.riskLevel === "medium" ? "bg-warning/10 text-warning border-warning/30" :
                  "bg-success/10 text-success border-success/30"
                }`}
              >
                {levelLabel[risk.riskLevel][lang]}
              </Badge>
              <Badge variant="outline" className="text-[9px]">
                {confidenceLabel[risk.confidenceLevel][lang]}
              </Badge>
            </div>
          </div>

          {/* Triggered factors */}
          {risk.triggeredFactors.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                {lang === "fr" ? "Facteurs déclenchés" : "Triggered Factors"}
                {" "}({risk.triggeredFactors.length})
              </p>
              {risk.triggeredFactors.map(f => (
                <FactorRow key={f.id} factor={f} lang={lang} />
              ))}
            </div>
          )}

          {risk.triggeredFactors.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              {lang === "fr"
                ? "Aucun facteur de risque détecté dans les preuves actuelles."
                : "No risk factors detected in current evidence."}
            </p>
          )}
        </>
      )}

      {/* Methodology note */}
      <p className="text-[9px] text-muted-foreground border-t border-border pt-2">
        {lang === "fr"
          ? "Score calculé à partir de signaux on-chain détectables dans les preuves du dossier. Ce n'est pas une conclusion définitive."
          : "Score computed from detectable on-chain signals in case evidence. This is not a definitive conclusion."}
      </p>
    </motion.div>
  );
}
