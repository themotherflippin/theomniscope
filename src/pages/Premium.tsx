import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Crown, Zap, Brain, Eye, Wallet, BarChart3, Bell, Shield,
  Activity, Search, FolderOpen, Network, ChevronLeft, Sparkles, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePremium } from "@/hooks/usePremium";
import { useI18n } from "@/lib/i18n";
import PremiumUpgradeModal from "@/components/PremiumUpgradeModal";

const spring = { type: "spring" as const, stiffness: 400, damping: 28 };

const PREMIUM_FEATURES = [
  {
    icon: Activity,
    title: { en: "Signal Compass PRO", fr: "Signal Compass PRO" },
    desc: { en: "Confidence scoring, multi-timeframe signals, and advanced strategy detection", fr: "Score de confiance, signaux multi-timeframe et détection de stratégies avancées" },
    color: "var(--primary)",
  },
  {
    icon: Brain,
    title: { en: "Unlimited AI Insights", fr: "Analyses IA illimitées" },
    desc: { en: "Deep on-chain analysis, risk assessment and opportunity detection powered by AI", fr: "Analyse on-chain approfondie, évaluation de risques et détection d'opportunités par IA" },
    color: "var(--chart-cyan)",
  },
  {
    icon: Eye,
    title: { en: "Smart Money Tracking", fr: "Suivi Smart Money" },
    desc: { en: "Track whale wallets, smart money flows and insider movements in real time", fr: "Suivez les baleines, les flux smart money et les mouvements d'initiés en temps réel" },
    color: "var(--success)",
  },
  {
    icon: Wallet,
    title: { en: "Unlimited Wallet Tracking", fr: "Suivi de wallets illimité" },
    desc: { en: "Monitor unlimited wallets across all chains with full transaction history", fr: "Surveillez un nombre illimité de wallets sur toutes les blockchains" },
    color: "var(--chart-blue)",
  },
  {
    icon: Search,
    title: { en: "Full Wallet Scanner", fr: "Scanner de Wallet Complet" },
    desc: { en: "Deep scan with counterparties, flow analysis, cluster detection", fr: "Scan en profondeur avec contreparties, flux et détection de clusters" },
    color: "var(--warning)",
  },
  {
    icon: Shield,
    title: { en: "Token Intelligence", fr: "Intelligence Token" },
    desc: { en: "Bubblemaps, holder concentration, risk signals and whale tracking", fr: "Bubblemaps, concentration des détenteurs, signaux de risque et suivi de baleines" },
    color: "var(--danger)",
  },
  {
    icon: FolderOpen,
    title: { en: "Investigation Cases", fr: "Dossiers d'investigation" },
    desc: { en: "Create investigation dossiers, bookmark evidence, generate forensic reports", fr: "Créez des dossiers d'enquête, sauvegardez des preuves, générez des rapports" },
    color: "var(--chart-yellow)",
  },
  {
    icon: Bell,
    title: { en: "Advanced Alerts", fr: "Alertes Avancées" },
    desc: { en: "Custom alert rules for whale movements, smart money flows, and early signals", fr: "Alertes personnalisées pour mouvements de baleines et signaux précoces" },
    color: "var(--chart-purple)",
  },
  {
    icon: Network,
    title: { en: "Cluster Analysis", fr: "Analyse de Clusters" },
    desc: { en: "Map wallet relationships and detect coordinated activity across chains", fr: "Cartographiez les relations entre wallets et détectez l'activité coordonnée" },
    color: "var(--chart-green)",
  },
  {
    icon: BarChart3,
    title: { en: "Performance Analytics", fr: "Analytics Avancés" },
    desc: { en: "Full PnL tracking, portfolio metrics and detailed performance analysis", fr: "Suivi complet PnL, métriques de portefeuille et analyse de performance détaillée" },
    color: "var(--chart-orange)",
  },
];

const FREE_LIMITS = [
  { en: "3 wallets tracked", fr: "3 wallets suivis" },
  { en: "1 AI insight per day", fr: "1 analyse IA par jour" },
  { en: "7-day history", fr: "Historique 7 jours" },
  { en: "Basic price alerts", fr: "Alertes de prix basiques" },
];

export default function Premium() {
  const navigate = useNavigate();
  const { premium } = usePremium();
  const { lang } = useI18n();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const l = lang === "fr" ? "fr" : "en";

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-24 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-lg font-display font-bold">Premium</h1>
      </div>

      {/* Status banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border p-5 text-center space-y-3 ${
          premium.isPremium
            ? "border-[hsl(42_95%_50%/0.3)] bg-[hsl(42_95%_50%/0.06)]"
            : "border-primary/20 bg-primary/5"
        }`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ ...spring, delay: 0.1 }}
          className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto"
        >
          <Crown className="w-8 h-8 text-primary" />
        </motion.div>

        {premium.isPremium ? (
          <>
            <h2 className="text-xl font-display font-bold text-foreground">Premium Actif</h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(42_95%_50%/0.12)] border border-[hsl(42_95%_50%/0.25)]">
              <Zap className="w-3 h-3 text-[hsl(42,95%,50%)]" />
              <span className="text-[10px] font-bold text-[hsl(42,95%,50%)] uppercase tracking-widest">
                {premium.source === "subscription" ? "Abonnement" : premium.source === "nft" ? "NFT Pass" : "Voucher"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {l === "fr" ? "Toutes les fonctionnalités sont débloquées." : "All features are unlocked."}
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-display font-bold text-foreground">
              {l === "fr" ? "Passez Premium" : "Go Premium"}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
              {l === "fr"
                ? "Débloquez l'arsenal complet d'investigation on-chain. Ne tradez plus à l'aveugle."
                : "Unlock the full on-chain investigation arsenal. Don't trade blind."}
            </p>

            {/* Free limits */}
            <div className="rounded-xl bg-muted/30 border border-border/30 p-3 space-y-1.5">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">
                {l === "fr" ? "Limites gratuites" : "Free tier limits"}
              </p>
              {FREE_LIMITS.map((limit) => (
                <div key={limit.en} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="w-3 h-3 text-muted-foreground/50" />
                  <span>{limit[l]}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => setShowUpgrade(true)}
              className="w-full h-12 rounded-xl font-bold text-sm gap-2 shadow-[0_0_24px_-4px_hsl(var(--primary)/0.4)]"
            >
              <Zap className="w-4 h-4" />
              {l === "fr" ? "Débloquer Premium — $9.99/sem" : "Unlock Premium — $9.99/wk"}
            </Button>
          </>
        )}
      </motion.div>

      {/* Features grid */}
      <div className="space-y-2">
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium px-1">
          {l === "fr" ? "Fonctionnalités Premium" : "Premium Features"}
        </p>
        <div className="space-y-2">
          {PREMIUM_FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title.en}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.03 * i }}
                className="flex items-start gap-3 rounded-xl border border-border/30 bg-card/50 p-3"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `hsl(${feat.color} / 0.12)` }}
                >
                  <Icon className="w-4 h-4" style={{ color: `hsl(${feat.color})` }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-foreground">{feat.title[l]}</h3>
                    {premium.isPremium && (
                      <Sparkles className="w-3 h-3 text-primary/50" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                    {feat.desc[l]}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-muted-foreground/50 pt-2">
        {l === "fr" ? "Annulation à tout moment • Paiement sécurisé" : "Cancel anytime • Secure payment"}
      </div>

      <PremiumUpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
