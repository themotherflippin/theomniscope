import { useState } from "react";
import { Crown, Loader2 } from "lucide-react";
import { usePremium } from "@/hooks/usePremium";
import PremiumUpgradeModal from "./PremiumUpgradeModal";

export default function PremiumBadge() {
  const { premium, loading } = usePremium();
  const [showModal, setShowModal] = useState(false);

  if (loading) return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;

  if (premium.isPremium) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
        <Crown className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">Premium</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 border border-border/50 hover:bg-primary/10 hover:border-primary/20 transition-colors"
      >
        <Crown className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Upgrade</span>
      </button>
      <PremiumUpgradeModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
