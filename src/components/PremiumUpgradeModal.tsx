import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, CreditCard, KeyRound, Loader2, ChevronDown, Shield, Sparkles, Crown, X } from "lucide-react";
import { useWeb3Modal } from "@web3modal/ethers/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePremium } from "@/hooks/usePremium";
import { useI18n } from "@/lib/i18n";

const spring = { type: "spring" as const, stiffness: 300, damping: 24 };

export default function PremiumUpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { open: openWallet } = useWeb3Modal();
  const {
    premium,
    walletConnecting,
    checkoutLoading,
    error,
    startCheckout,
    submitVoucher,
    isWalletConnected,
  } = usePremium();

  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const { lang } = useI18n();

  const handleCodeSubmit = async () => {
    if (!code.trim()) return;
    setCodeLoading(true);
    const success = await submitVoucher(code);
    if (success) onClose();
    setCodeLoading(false);
  };

  const walletConnected = isWalletConnected || !!premium.walletAddress;

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.95 }}
          transition={spring}
          className="w-full max-w-md relative"
        >
          {/* Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-card/80 backdrop-blur-2xl backdrop-saturate-[1.4] shadow-2xl shadow-black/30 p-6 space-y-4">
            {/* Top glow line */}
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            {/* Close button */}
            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center pb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-3">
                <Crown className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Premium</span>
              </div>
              <h2 className="text-xl font-display font-bold text-foreground">
                {lang === "fr" ? "Passer en Premium" : "Upgrade to Premium"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {lang === "fr"
                  ? "Débloquez toutes les fonctionnalités avancées"
                  : "Unlock all advanced features"}
              </p>
            </div>

            {/* Wallet Status */}
            {walletConnected && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-300 font-mono truncate">
                  {premium.walletAddress?.slice(0, 6)}…{premium.walletAddress?.slice(-4)}
                </span>
                {premium.nftVerified && (
                  <span className="ml-auto text-[10px] font-semibold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> NFT
                  </span>
                )}
              </motion.div>
            )}

            {/* 1. Connect Wallet */}
            <motion.div whileTap={{ scale: 0.98 }} transition={spring}>
              <Button
                onClick={() => openWallet()}
                disabled={walletConnecting || walletConnected}
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold text-sm gap-2"
              >
                {walletConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                {walletConnected
                  ? lang === "fr" ? "Wallet Connecté" : "Wallet Connected"
                  : walletConnecting
                  ? lang === "fr" ? "Connexion…" : "Connecting…"
                  : lang === "fr" ? "Connecter le Wallet" : "Connect Wallet"}
              </Button>
            </motion.div>

            {/* 2. Subscribe */}
            <motion.div whileTap={{ scale: 0.98 }} transition={spring}>
              <Button
                onClick={startCheckout}
                disabled={checkoutLoading}
                variant="outline"
                className="w-full h-12 rounded-xl font-semibold text-sm gap-2 border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12]"
              >
                {checkoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4 text-cyan-400" />}
                <span>{lang === "fr" ? "Abonnement Hebdo" : "Subscribe Weekly"}</span>
                <span className="ml-auto text-xs text-muted-foreground">$9.99/wk</span>
              </Button>
            </motion.div>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-border/30" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {lang === "fr" ? "ou" : "or"}
              </span>
              <div className="flex-1 h-px bg-border/30" />
            </div>

            {/* Voucher Code */}
            <div>
              <button
                onClick={() => setShowCodeInput(!showCodeInput)}
                className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{lang === "fr" ? "Code Voucher" : "Voucher Code"}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCodeInput ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {showCodeInput && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={spring}
                    className="overflow-hidden"
                  >
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="XXXX-XXXX"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === "Enter" && handleCodeSubmit()}
                        className="font-mono tracking-widest text-center text-sm"
                        maxLength={12}
                      />
                      <Button onClick={handleCodeSubmit} disabled={!code.trim() || codeLoading} size="sm" className="px-4">
                        {codeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "→"}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-sm text-destructive text-center px-2"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
