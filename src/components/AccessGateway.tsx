import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, CreditCard, Coins, KeyRound, Loader2, ChevronDown, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAccessGateway } from "@/hooks/useAccessGateway";
import { useI18n } from "@/lib/i18n";
import oracleLogo from "@/assets/oracle-logo.png";

const spring = { type: "spring" as const, stiffness: 300, damping: 24 };

export default function AccessGateway({ onGranted }: { onGranted: () => void }) {
  const {
    status,
    loading,
    walletConnecting,
    checkoutLoading,
    error,
    connectWallet,
    startCheckout,
    useCredits,
    submitInvitationCode,
    grantAccess,
  } = useAccessGateway();

  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const { lang, toggleLang } = useI18n();

  const handleCodeSubmit = async () => {
    if (!code.trim()) return;
    setCodeLoading(true);
    const success = await submitInvitationCode(code);
    if (success) onGranted();
    setCodeLoading(false);
  };

  // If access is granted, call onGranted
  if (status.hasAccess && !loading) {
    onGranted();
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying access…</p>
        </motion.div>
      </div>
    );
  }

  // handleCodeSubmit moved above early returns

  const hasWallet = !!(window as any).ethereum;
  const walletConnected = !!status.walletAddress;

  return (
    <div className="min-h-screen bg-background gradient-hero flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/5 blur-[100px] pointer-events-none" />

      {/* Language toggle */}
      <button
        onClick={toggleLang}
        className="absolute top-6 right-6 z-10 flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors bg-muted/50 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border/50"
      >
        <span className={lang === "en" ? "text-foreground font-semibold" : ""}>EN</span>
        <span className="text-muted-foreground/40">|</span>
        <span className={lang === "fr" ? "text-foreground font-semibold" : ""}>FR</span>
      </button>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={spring}
        className="w-full max-w-md"
      >
        {/* Logo & Title */}
        <div className="text-center mb-6">
          <motion.img
            src={oracleLogo}
            alt="Oracle"
            className="w-32 h-32 mx-auto object-contain mb-2"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ ...spring, delay: 0.1 }}
          />
          <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
            Access Oracle System
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === "fr"
              ? "Connectez-vous pour accéder au système"
              : "Connect to access the system"}
          </p>
        </div>

        {/* Main Card */}
        <div className="relative rounded-2xl border border-white/[0.08] bg-card/60 backdrop-blur-2xl backdrop-saturate-[1.4] shadow-2xl shadow-black/30 p-6 space-y-4">
          {/* Subtle top glow line */}
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          {/* Wallet Status */}
          {walletConnected && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-emerald-300 font-mono truncate">
                {status.walletAddress?.slice(0, 6)}…{status.walletAddress?.slice(-4)}
              </span>
              {status.nftVerified && (
                <span className="ml-auto text-[10px] font-semibold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> NFT HOLDER
                </span>
              )}
            </motion.div>
          )}

          {/* 1. Connect Wallet */}
          <motion.div whileTap={{ scale: 0.98 }} transition={spring}>
            <Button
              onClick={() => connectWallet()}
              disabled={walletConnecting || walletConnected}
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold text-sm gap-2 relative overflow-hidden"
            >
              {walletConnecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wallet className="w-4 h-4" />
              )}
              {walletConnected
                ? lang === "fr"
                  ? "Wallet Connecté"
                  : "Wallet Connected"
                : walletConnecting
                ? lang === "fr"
                  ? "Connexion…"
                  : "Connecting…"
                : hasWallet
                ? lang === "fr"
                  ? "Connecter le Wallet"
                  : "Connect Wallet"
                : lang === "fr"
                ? "Installer MetaMask"
                : "Install MetaMask"}
            </Button>
          </motion.div>

          {/* 2. Subscribe Weekly */}
          <motion.div whileTap={{ scale: 0.98 }} transition={spring}>
            <Button
              onClick={startCheckout}
              disabled={checkoutLoading}
              variant="outline"
              className="w-full h-12 rounded-xl font-semibold text-sm gap-2 border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12]"
            >
              {checkoutLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4 text-cyan-400" />
              )}
              <span>
                {lang === "fr" ? "Abonnement Hebdo" : "Subscribe Weekly"}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">$9.99/wk</span>
            </Button>
          </motion.div>

          {/* 3. Use Credits */}
          {status.credits > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              transition={spring}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={() => useCredits(1)}
                variant="outline"
                className="w-full h-12 rounded-xl font-semibold text-sm gap-2 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/30 text-amber-200"
              >
                <Coins className="w-4 h-4 text-amber-400" />
                <span>
                  {lang === "fr" ? "Utiliser des Crédits" : "Use Credits"}
                </span>
                <span className="ml-auto text-xs font-mono bg-amber-500/20 px-2 py-0.5 rounded-full">
                  {status.credits}
                </span>
              </Button>
            </motion.div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-border/30" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {lang === "fr" ? "ou" : "or"}
            </span>
            <div className="flex-1 h-px bg-border/30" />
          </div>

          {/* 4. Invitation Code (fallback) */}
          <div>
            <button
              onClick={() => setShowCodeInput(!showCodeInput)}
              className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{lang === "fr" ? "Code d'invitation" : "Invitation Code"}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${showCodeInput ? "rotate-180" : ""}`}
              />
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
                    <Button
                      onClick={handleCodeSubmit}
                      disabled={!code.trim() || codeLoading}
                      size="sm"
                      className="px-4"
                    >
                      {codeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "→"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error display */}
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

        {/* Footer */}
        <p className="text-[11px] text-muted-foreground text-center mt-4">
          {lang === "fr"
            ? "Propulsé par Oracle Labs — Accès sécurisé"
            : "Powered by Oracle Labs — Secure Access"}
        </p>
      </motion.div>
    </div>
  );
}
