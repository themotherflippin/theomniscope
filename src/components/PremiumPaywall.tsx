import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import PremiumUpgradeModal from "./PremiumUpgradeModal";

interface PaywallConfig {
  wallet: { title: string; description: string };
  ai: { title: string; description: string };
  signals: { title: string; description: string };
  alerts: { title: string; description: string };
  analytics: { title: string; description: string };
  generic: { title: string; description: string };
}

const PAYWALL_COPY: PaywallConfig = {
  wallet: {
    title: "Free wallet limit reached",
    description: "Upgrade to Premium to track unlimited wallets and monitor smart money in real time.",
  },
  ai: {
    title: "Daily AI insight limit reached",
    description: "Premium users get unlimited deep analysis and early opportunity detection.",
  },
  signals: {
    title: "Signal Compass PRO is a Premium feature",
    description: "Unlock full confidence scoring and smart money breakdown.",
  },
  alerts: {
    title: "Advanced alerts require Premium",
    description: "Get real-time custom alerts on whale movements, smart money flows, and early signals.",
  },
  analytics: {
    title: "Advanced analytics require Premium",
    description: "Access full PnL tracking, performance metrics, and detailed portfolio analysis.",
  },
  generic: {
    title: "Premium feature",
    description: "Upgrade to unlock this feature and get the full Oracle experience.",
  },
};

type PaywallType = keyof PaywallConfig;

interface PremiumPaywallProps {
  type: PaywallType;
  inline?: boolean;
  children?: React.ReactNode;
}

export function PremiumPaywall({ type, inline = false, children }: PremiumPaywallProps) {
  const [showModal, setShowModal] = useState(false);
  const copy = PAYWALL_COPY[type];

  if (inline) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-primary/10 bg-primary/[0.04] p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lock className="w-3.5 h-3.5 text-primary" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">{copy.title}</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{copy.description}</p>
          <Button
            onClick={() => setShowModal(true)}
            size="sm"
            className="gap-1.5 rounded-lg text-xs h-8 shadow-[0_0_16px_-4px_hsl(var(--primary)/0.3)]"
          >
            <Zap className="w-3 h-3" />
            Unlock Premium
          </Button>
        </motion.div>
        <PremiumUpgradeModal open={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm"
        >
          <div className="text-center space-y-3 p-6 max-w-[260px]">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">{copy.title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{copy.description}</p>
            <Button
              onClick={() => setShowModal(true)}
              size="sm"
              className="gap-1.5 rounded-lg text-xs h-8 shadow-[0_0_16px_-4px_hsl(var(--primary)/0.3)]"
            >
              <Zap className="w-3 h-3" />
              Unlock Premium
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
      {children}
      <PremiumUpgradeModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
