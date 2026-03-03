import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import PremiumUpgradeModal from "./PremiumUpgradeModal";
import { usePremium } from "@/hooks/usePremium";
import { useI18n } from "@/lib/i18n";

interface FeatureGateProps {
  feature: "scanner" | "tokenIntel" | "cases" | "advancedAlerts" | "clusters";
  children: React.ReactNode;
}

const GATE_COPY: Record<FeatureGateProps["feature"], { en: { title: string; desc: string }; fr: { title: string; desc: string }; icon: React.ElementType }> = {
  scanner: {
    en: { title: "Full Wallet Scanner", desc: "Deep scan wallets with counterparties, flow analysis and cluster detection. Upgrade to Premium to unlock." },
    fr: { title: "Scanner de Wallet Complet", desc: "Scannez les wallets en profondeur avec contreparties, flux et clusters. Passez Premium pour débloquer." },
    icon: Lock,
  },
  tokenIntel: {
    en: { title: "Token Intelligence", desc: "Access Bubblemaps, holder concentration analysis, risk signals and whale tracking. Premium only." },
    fr: { title: "Intelligence Token", desc: "Accédez aux Bubblemaps, analyse de concentration, signaux de risque et suivi de baleines. Réservé Premium." },
    icon: Lock,
  },
  cases: {
    en: { title: "Investigation Cases", desc: "Create investigation dossiers, bookmark evidence, generate forensic reports. Premium feature." },
    fr: { title: "Dossiers d'Investigation", desc: "Créez des dossiers d'enquête, sauvegardez des preuves, générez des rapports. Fonctionnalité Premium." },
    icon: Lock,
  },
  advancedAlerts: {
    en: { title: "Advanced Alert Rules", desc: "Set custom alert rules for whale movements, smart money flows, and early signals. Premium required." },
    fr: { title: "Alertes Avancées", desc: "Configurez des alertes personnalisées pour les mouvements de baleines et signaux. Réservé Premium." },
    icon: Lock,
  },
  clusters: {
    en: { title: "Cluster Analysis", desc: "Map wallet relationships and detect coordinated activity across the blockchain. Premium only." },
    fr: { title: "Analyse de Clusters", desc: "Cartographiez les relations entre wallets et détectez l'activité coordonnée. Réservé Premium." },
    icon: Lock,
  },
};

export function FeatureGate({ feature, children }: FeatureGateProps) {
  const { premium } = usePremium();
  const { lang } = useI18n();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (premium.isPremium) return <>{children}</>;

  const copy = GATE_COPY[feature][lang === "fr" ? "fr" : "en"];

  return (
    <>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm w-full text-center space-y-5"
        >
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Crown className="w-8 h-8 text-primary" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-display font-bold text-foreground">{copy.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{copy.desc}</p>
          </div>

          {/* Blurred preview */}
          <div className="relative rounded-xl overflow-hidden border border-border/30">
            <div className="blur-sm opacity-40 pointer-events-none p-4 space-y-3">
              <div className="h-8 bg-muted/50 rounded-lg w-3/4" />
              <div className="h-6 bg-muted/50 rounded-lg w-1/2" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-20 bg-muted/40 rounded-lg" />
                <div className="h-20 bg-muted/40 rounded-lg" />
              </div>
              <div className="h-32 bg-muted/30 rounded-lg" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </div>

          <Button
            onClick={() => setShowUpgrade(true)}
            className="gap-2 rounded-xl h-11 px-6 shadow-[0_0_20px_-4px_hsl(var(--primary)/0.4)] font-bold"
          >
            <Zap className="w-4 h-4" />
            {lang === "fr" ? "Passer Premium" : "Upgrade to Premium"}
          </Button>
        </motion.div>
      </div>
      <PremiumUpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </>
  );
}
