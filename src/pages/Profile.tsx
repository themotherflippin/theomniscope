import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { useNavigate } from 'react-router-dom';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { usePremium } from '@/hooks/usePremium';
import PremiumUpgradeModal from '@/components/PremiumUpgradeModal';
import type { UserPreferences, ThemeMode, RiskProfile } from '@/lib/userPreferences';
import type { Chain } from '@/lib/types';
import {
  Sun, Moon, Eye, Gauge, Shield, Zap, TrendingUp,
  Wallet, CreditCard, ShieldCheck, Bell, Brain,
  Globe, Sparkles, ChevronRight, Crown, Palette,
  SlidersHorizontal, Link2,
} from 'lucide-react';

interface ProfileProps {
  prefs: UserPreferences;
  onUpdatePrefs: (partial: Partial<UserPreferences>) => void;
}

const spring = { type: "spring" as const, stiffness: 500, damping: 30 };

const chainOptions: { id: Chain; label: string }[] = [
  { id: 'ethereum', label: 'ETH' },
  { id: 'solana', label: 'SOL' },
  { id: 'bsc', label: 'BNB' },
  { id: 'polygon', label: 'MATIC' },
  { id: 'arbitrum', label: 'ARB' },
  { id: 'base', label: 'BASE' },
  { id: 'cronos', label: 'CRO' },
];

function WidgetCard({ icon: Icon, color, title, children, onClick, trailing }: {
  icon: React.ElementType;
  color: string;
  title: string;
  children: React.ReactNode;
  onClick?: () => void;
  trailing?: React.ReactNode;
}) {
  const Wrapper = onClick ? motion.button : motion.div;
  return (
    <Wrapper
      whileTap={onClick ? { scale: 0.97 } : undefined}
      transition={spring}
      onClick={onClick}
      className="rounded-xl border border-border/30 p-3 text-left w-full"
      style={{ background: `hsl(${color} / 0.08)` }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" style={{ color: `hsl(${color})` }} />
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium font-display">{title}</span>
        </div>
        {trailing}
      </div>
      {children}
    </Wrapper>
  );
}

function OptionChip({ active, label, icon: Icon, onClick }: {
  active: boolean;
  label: string;
  icon?: React.ElementType;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      animate={{ scale: active ? 1.02 : 1 }}
      transition={spring}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[11px] font-bold transition-all duration-200 ${
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25'
          : 'border-border/50 bg-muted/30 text-muted-foreground hover:border-border active:bg-muted/60'
      }`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {label}
    </motion.button>
  );
}

function QuickNavRow({ icon: Icon, label, subtitle, onClick, trailing }: {
  icon: React.ElementType;
  label: string;
  subtitle?: string;
  onClick: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.985 }}
      transition={spring}
      onClick={onClick}
      className="flex items-center gap-2.5 w-full py-1.5 text-left"
    >
      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/8">
        <Icon className="w-3.5 h-3.5 text-primary" strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[13px] font-medium text-foreground leading-tight">{label}</span>
        {subtitle && <p className="text-[10px] text-muted-foreground leading-tight">{subtitle}</p>}
      </div>
      {trailing}
      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
    </motion.button>
  );
}

export default function Profile({ prefs, onUpdatePrefs }: ProfileProps) {
  const { t, lang, toggleLang } = useI18n();
  const navigate = useNavigate();
  const isAdmin = useAdminStatus();
  const { premium } = usePremium();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [expandedWidget, setExpandedWidget] = useState<string | null>(null);

  const toggleWidget = (id: string) =>
    setExpandedWidget(prev => (prev === id ? null : id));

  const riskLabels: Record<RiskProfile, string> = {
    conservative: t('onboarding.conservative'),
    standard: t('onboarding.standard'),
    aggressive: t('onboarding.aggressive'),
  };

  return (
    <div className="min-h-screen">
      <main className="px-3 pt-2 pb-8 space-y-2.5 max-w-lg mx-auto">

        {/* Row 1: Account + Subscription */}
        <div className="grid grid-cols-2 gap-2">
          {/* Account */}
          <WidgetCard
            icon={Wallet}
            color="var(--chart-blue)"
            title={lang === 'fr' ? 'Wallet' : 'Wallet'}
            onClick={() => setShowUpgrade(true)}
          >
            <p className="text-sm font-mono font-bold truncate">
              {premium.walletAddress
                ? `${premium.walletAddress.slice(0, 6)}…${premium.walletAddress.slice(-4)}`
                : '—'}
            </p>
            <p className="text-[9px] text-muted-foreground mt-0.5">
              {premium.walletAddress
                ? (lang === 'fr' ? 'Connecté' : 'Connected')
                : (lang === 'fr' ? 'Non connecté' : 'Not connected')}
            </p>
          </WidgetCard>

          {/* Subscription */}
          <WidgetCard
            icon={premium.isPremium ? Crown : CreditCard}
            color="var(--warning)"
            title={lang === 'fr' ? 'Abonnement' : 'Plan'}
            onClick={() => setShowUpgrade(true)}
            trailing={
              premium.isPremium ? (
                <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[hsl(42_95%_50%/0.15)] text-[hsl(42,95%,50%)] border border-[hsl(42_95%_50%/0.2)]">
                  Premium
                </span>
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--warning))]" />
              )
            }
          >
            <p className="text-sm font-bold">
              {premium.isPremium
                ? (premium.source === 'subscription' ? '$9.99/wk' : premium.source === 'nft' ? 'NFT' : 'Voucher')
                : (lang === 'fr' ? 'Gratuit' : 'Free')}
            </p>
            {!premium.isPremium && (
              <p className="text-[9px] text-primary mt-0.5 font-medium">
                {lang === 'fr' ? 'Passer Premium →' : 'Upgrade →'}
              </p>
            )}
          </WidgetCard>
        </div>

        {/* Row 2: Appearance — Theme + Mode side by side */}
        <WidgetCard
          icon={Palette}
          color="var(--chart-cyan)"
          title={t('profile.appearance')}
        >
          <div className="grid grid-cols-2 gap-3">
            {/* Theme */}
            <div>
              <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">
                {lang === 'fr' ? 'Thème' : 'Theme'}
              </p>
              <div className="flex gap-1.5">
                <OptionChip
                  active={prefs.theme === 'light'}
                  label={t('profile.light')}
                  icon={Sun}
                  onClick={() => onUpdatePrefs({ theme: 'light' })}
                />
                <OptionChip
                  active={prefs.theme === 'dark'}
                  label={t('profile.dark')}
                  icon={Moon}
                  onClick={() => onUpdatePrefs({ theme: 'dark' })}
                />
              </div>
            </div>

            {/* Display Mode */}
            <div>
              <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">
                {t('profile.displayMode')}
              </p>
              <div className="flex gap-1.5">
                <OptionChip
                  active={prefs.mode === 'simple'}
                  label={t('onboarding.simple')}
                  icon={Eye}
                  onClick={() => onUpdatePrefs({ mode: 'simple' })}
                />
                <OptionChip
                  active={prefs.mode === 'pro'}
                  label={t('onboarding.pro')}
                  icon={Gauge}
                  onClick={() => onUpdatePrefs({ mode: 'pro' })}
                />
              </div>
            </div>
          </div>
        </WidgetCard>

        {/* Row 3: Preferences — Risk + Chains + Language */}
        <WidgetCard
          icon={SlidersHorizontal}
          color="var(--success)"
          title={lang === 'fr' ? 'Préférences' : 'Preferences'}
        >
          <div className="space-y-2.5">
            {/* Risk Profile */}
            <div>
              <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">
                {t('profile.riskProfile')}
              </p>
              <div className="flex gap-2">
                {(['conservative', 'standard', 'aggressive'] as const).map(r => {
                  const icons = { conservative: Shield, standard: Zap, aggressive: TrendingUp };
                  return (
                    <OptionChip
                      key={r}
                      active={prefs.riskProfile === r}
                      label={riskLabels[r]}
                      icon={icons[r]}
                      onClick={() => onUpdatePrefs({ riskProfile: r })}
                    />
                  );
                })}
              </div>
            </div>

            {/* Chains */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] text-muted-foreground font-medium">
                  {t('profile.activeChains')}
                </p>
                <span className="text-[9px] font-mono text-muted-foreground">{prefs.chains.length}/7</span>
              </div>
              <div className="flex gap-1">
                {chainOptions.map(c => (
                  <OptionChip
                    key={c.id}
                    active={prefs.chains.includes(c.id)}
                    label={c.label}
                    onClick={() => {
                      const next = prefs.chains.includes(c.id)
                        ? prefs.chains.filter(x => x !== c.id)
                        : [...prefs.chains, c.id];
                      onUpdatePrefs({ chains: next });
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Language */}
            <div className="flex items-center justify-between pt-1 border-t border-border/20">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[12px] text-muted-foreground font-medium">
                  {lang === 'fr' ? 'Langue' : 'Language'}
                </span>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                transition={spring}
                onClick={toggleLang}
                className="px-2.5 py-1 rounded-lg border border-primary/30 bg-primary/10 text-primary text-[11px] font-bold"
              >
                {lang.toUpperCase()}
              </motion.button>
            </div>
          </div>
        </WidgetCard>

        {/* Row 4: Quick Navigation */}
        <WidgetCard
          icon={Link2}
          color="var(--chart-yellow)"
          title={lang === 'fr' ? 'Navigation rapide' : 'Quick Access'}
        >
          <div className="space-y-0.5 divide-y divide-border/20">
            <QuickNavRow
              icon={Bell}
              label={lang === 'fr' ? 'Règles d\'alertes' : 'Alert Rules'}
              onClick={() => navigate('/alert-rules')}
            />
            <QuickNavRow
              icon={Brain}
              label={lang === 'fr' ? 'Assistant IA' : 'AI Assistant'}
              subtitle={premium.isPremium
                ? (lang === 'fr' ? 'Illimité' : 'Unlimited')
                : (lang === 'fr' ? '1 analyse/jour' : '1 insight/day')}
              onClick={() => {}}
            />
          </div>
        </WidgetCard>

        {/* Admin — separate block, only visible to admin */}
        {isAdmin && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            transition={spring}
            onClick={() => navigate('/admin')}
            className="w-full flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-destructive/10">
              <ShieldCheck className="w-4 h-4 text-destructive" strokeWidth={1.8} />
            </div>
            <div className="flex-1 text-left">
              <span className="text-[13px] font-medium text-foreground">Administration</span>
            </div>
            <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">
              Admin
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
          </motion.button>
        )}

        {/* Footer */}
        <div className="text-center text-[10px] text-muted-foreground/40 pt-1 pb-4 space-y-0.5 font-mono">
          <p>ORACLE v1.0 — by The Flippin' Labs</p>
          <p>{t('profile.disclaimer')}</p>
        </div>
      </main>

      <PremiumUpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
