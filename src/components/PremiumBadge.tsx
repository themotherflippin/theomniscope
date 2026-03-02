import { useState } from "react";
import { Crown, Loader2, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { usePremium } from "@/hooks/usePremium";
import PremiumUpgradeModal from "./PremiumUpgradeModal";

export default function PremiumBadge() {
  const { premium, loading } = usePremium();
  const [showModal, setShowModal] = useState(false);

  if (loading) return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;

  if (premium.isPremium) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-400/30">
        <Crown className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest">Premium</span>
      </div>
    );
  }

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={() => setShowModal(true)}
        className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors"
      >
        <div className="absolute inset-0 rounded-full bg-primary/5 animate-pulse" />
        <Zap className="w-3.5 h-3.5 text-primary relative z-[1]" />
        <span className="text-[10px] font-bold text-primary uppercase tracking-widest relative z-[1]">Upgrade</span>
      </motion.button>
      <PremiumUpgradeModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
