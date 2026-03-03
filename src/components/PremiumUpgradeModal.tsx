import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, CreditCard, KeyRound, Loader2, ChevronDown,
  Shield, Sparkles, X, Zap, Brain, Activity, BarChart3, Bell, Eye,
} from "lucide-react";
import { useWeb3Modal } from "@web3modal/ethers/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePremium } from "@/hooks/usePremium";

const spring = { type: "spring" as const, stiffness: 260, damping: 20 };

const FEATURES = [
  { icon: Activity, label: "Signal Compass PRO with confidence score" },
  { icon: Brain, label: "Unlimited AI-powered insights" },
  { icon: Eye, label: "Track smart money in real time" },
  { icon: Wallet, label: "Unlimited wallet tracking" },
  { icon: BarChart3, label: "Advanced performance analytics" },
  { icon: Bell, label: "Priority alerts & early signals" },
];

export default function PremiumUpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { open: openWallet } = useWeb3Modal();
  const {
    premium, walletConnecting, checkoutLoading, error,
    startCheckout, submitVoucher, isWalletConnected,
  } = usePremium();

  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleCodeSubmit = async () => {
    if (!code.trim()) return;
    setCodeLoading(true);
    const ok = await submitVoucher(code);
    if (ok) {
      setSuccess(true);
      setTimeout(onClose, 1600);
    }
    setCodeLoading(false);
  };

  const walletConnected = isWalletConnected || !!premium.walletAddress;

  const isPremiumUser = premium.isPremium;

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: 60, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 60, opacity: 0, scale: 0.96 }}
          transition={spring}
          className="w-full max-w-md relative mx-4 mb-4 sm:mb-0"
        >
          <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-card/95 to-card/80 backdrop-blur-2xl backdrop-saturate-[1.4] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] overflow-hidden">
            {/* Top accent */}
            <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            {isPremiumUser ? (
              /* ===== PREMIUM WELCOME VIEW ===== */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 space-y-4"
              >
                <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10">
                  <X className="w-5 h-5" />
                </button>

                <div className="text-center space-y-2 pt-1">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ ...spring, delay: 0.1 }}
                    className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto"
                  >
                    <Sparkles className="w-7 h-7 text-primary" />
                  </motion.div>
                  <h2 className="text-lg font-display font-bold text-foreground">Premium Actif</h2>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(42_95%_50%/0.12)] border border-[hsl(42_95%_50%/0.25)]">
                    <Zap className="w-3 h-3 text-[hsl(42,95%,50%)]" />
                    <span className="text-[10px] font-bold text-[hsl(42,95%,50%)] uppercase tracking-widest">
                      {premium.source === 'subscription' ? 'Abonnement' : premium.source === 'nft' ? 'NFT Pass' : 'Voucher'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
                    Toutes les fonctionnalités Premium sont débloquées. Voici ce que vous avez :
                  </p>
                </div>

                <div className="space-y-2 py-1">
                  {FEATURES.map(({ icon: Icon, label }, i) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i }}
                      className="flex items-center gap-2.5"
                    >
                      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-xs text-foreground/80">{label}</span>
                      <Sparkles className="w-2.5 h-2.5 text-primary/40 ml-auto" />
                    </motion.div>
                  ))}
                </div>

                {walletConnected && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] text-emerald-300 font-mono truncate">
                      {premium.walletAddress?.slice(0, 6)}…{premium.walletAddress?.slice(-4)}
                    </span>
                  </div>
                )}

                <Button
                  onClick={onClose}
                  className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold text-sm gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Compris !
                </Button>
              </motion.div>
            ) : (
            /* ===== UPGRADE VIEW (original) ===== */
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-10 text-center space-y-3"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ ...spring, delay: 0.1 }}
                    className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto"
                  >
                    <Sparkles className="w-8 h-8 text-primary" />
                  </motion.div>
                  <h2 className="text-xl font-display font-bold text-foreground">Welcome to Premium</h2>
                  <p className="text-sm text-muted-foreground">All features unlocked.</p>
                </motion.div>
              ) : (
                <motion.div key="form" className="p-5 space-y-4">
                  {/* Close */}
                  <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10">
                    <X className="w-5 h-5" />
                  </button>

                  {/* Header */}
                  <div className="text-center space-y-1.5 pt-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                      <Zap className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Premium</span>
                    </div>
                    <h2 className="text-lg font-display font-bold text-foreground">Unlock Oracle Premium</h2>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
                      Most traders upgrade after their first smart alert. Don't trade blind.
                    </p>
                  </div>

                  {/* Feature list */}
                  <div className="space-y-2 py-2">
                    {FEATURES.map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="text-xs text-foreground/80">{label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Price block */}
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-2xl font-display font-bold text-foreground">$9.99</span>
                      <span className="text-xs text-muted-foreground">/week</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Cancel anytime · Secure payment via Stripe or WalletConnect</p>
                  </div>

                  {/* Wallet status */}
                  {walletConnected && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                    >
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[11px] text-emerald-300 font-mono truncate">
                        {premium.walletAddress?.slice(0, 6)}…{premium.walletAddress?.slice(-4)}
                      </span>
                      {premium.nftVerified && (
                        <span className="ml-auto text-[9px] font-semibold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> NFT
                        </span>
                      )}
                    </motion.div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2">
                    <motion.div whileTap={{ scale: 0.97 }} transition={spring}>
                      <Button
                        onClick={() => openWallet()}
                        disabled={walletConnecting || walletConnected}
                        className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold text-sm gap-2 shadow-[0_0_20px_-4px_hsl(var(--primary)/0.4)]"
                      >
                        {walletConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                        {walletConnected ? "Wallet Connected" : walletConnecting ? "Connecting…" : "Connect Wallet"}
                      </Button>
                    </motion.div>

                    <motion.div whileTap={{ scale: 0.97 }} transition={spring}>
                      <Button
                        onClick={startCheckout}
                        disabled={checkoutLoading}
                        variant="outline"
                        className="w-full h-11 rounded-xl font-semibold text-sm gap-2 border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]"
                      >
                        {checkoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4 text-cyan-400" />}
                        <span>Subscribe Weekly</span>
                        <span className="ml-auto text-xs text-muted-foreground">$9.99/wk</span>
                      </Button>
                    </motion.div>

                    <div>
                      <button
                        onClick={() => setShowCodeInput(!showCodeInput)}
                        className="w-full flex items-center justify-center gap-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors py-1.5"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>Voucher Code</span>
                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showCodeInput ? "rotate-180" : ""}`} />
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
                            <div className="flex gap-2 mt-1.5">
                              <Input
                                placeholder="XXXX-XXXX"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                onKeyDown={(e) => e.key === "Enter" && handleCodeSubmit()}
                                className="font-mono tracking-widest text-center text-sm h-9"
                                maxLength={12}
                              />
                              <Button onClick={handleCodeSubmit} disabled={!code.trim() || codeLoading} size="sm" className="px-4 h-9">
                                {codeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "→"}
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="w-full text-center text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors py-1"
                  >
                    Maybe later
                  </button>

                  <AnimatePresence>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-xs text-destructive text-center"
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
