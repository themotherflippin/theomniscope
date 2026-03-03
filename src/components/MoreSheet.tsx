import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye, BookOpen, Network, Zap,
  List, BarChart3, Lock, Crown,
} from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { motion } from "framer-motion";
import { usePremium } from "@/hooks/usePremium";
import { useUserPreferences } from "@/lib/userPreferences";
import { useI18n } from "@/lib/i18n";
import PremiumUpgradeModal from "./PremiumUpgradeModal";

interface MoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MoreSheet({ open, onOpenChange }: MoreSheetProps) {
  const navigate = useNavigate();
  const { premium } = usePremium();
  const { prefs } = useUserPreferences();
  const { t } = useI18n();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const isSimple = prefs.mode === "simple";

  const hubItems = [
    { icon: Eye, label: t('hub.watchlists'), path: "/watchlists", color: "from-blue-500/20 to-blue-600/5", iconColor: "text-blue-500", proOnly: false, premiumOnly: false },
    { icon: Zap, label: t('hub.alertRules'), path: "/alert-rules", color: "from-amber-500/20 to-amber-600/5", iconColor: "text-amber-500", proOnly: false, premiumOnly: false },
    { icon: List, label: t('hub.radar'), path: "/radar", color: "from-emerald-500/20 to-emerald-600/5", iconColor: "text-emerald-500", proOnly: false, premiumOnly: false },
    { icon: Network, label: t('hub.clusters'), path: "/intel", color: "from-violet-500/20 to-violet-600/5", iconColor: "text-violet-500", proOnly: true, premiumOnly: true },
    { icon: BarChart3, label: t('hub.opportunities'), path: "/opportunities", color: "from-cyan-500/20 to-cyan-600/5", iconColor: "text-cyan-500", proOnly: true, premiumOnly: false },
    { icon: BookOpen, label: t('hub.newListings'), path: "/new-listings", color: "from-rose-500/20 to-rose-600/5", iconColor: "text-rose-500", proOnly: false, premiumOnly: false },
  ];

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const visibleItems = hubItems.filter(item => {
    if (isSimple && item.proOnly) return false;
    return true;
  });

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh] px-4 pb-10">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-sm font-display tracking-wide">{t('hub.title')}</SheetTitle>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {t('hub.desc')}
            </p>
          </SheetHeader>

          <div className="grid grid-cols-3 gap-3 mt-2 mb-6">
            {visibleItems.map((item, idx) => {
              const isLocked = item.premiumOnly && !premium.isPremium;
              return (
                <motion.button
                  key={item.path}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.03, type: "spring", stiffness: 400, damping: 25 }}
                  onClick={() => isLocked ? setShowUpgrade(true) : go(item.path)}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border border-border/40 bg-gradient-to-b ${item.color} hover:scale-[1.03] active:scale-[0.97] transition-transform ${isLocked ? 'opacity-60' : ''}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-background/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
                    <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                  <p className="text-[11px] font-medium text-foreground leading-tight">{item.label}</p>
                  {isLocked && (
                    <div className="absolute top-1.5 right-1.5">
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {isSimple && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-center"
            >
              <p className="text-[10px] text-muted-foreground">
                <Crown className="w-3 h-3 inline mr-1" />
                {t('hub.proModeHint')}
              </p>
            </motion.div>
          )}
        </SheetContent>
      </Sheet>
      <PremiumUpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </>
  );
}
