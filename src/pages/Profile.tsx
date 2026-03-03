import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { useNavigate } from 'react-router-dom';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { usePremium } from '@/hooks/usePremium';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsRow } from '@/components/settings/SettingsRow';
import PremiumUpgradeModal from '@/components/PremiumUpgradeModal';
import type { UserPreferences, ThemeMode, RiskProfile } from '@/lib/userPreferences';
import type { Chain } from '@/lib/types';
import {
  Sun, Moon, Eye, Gauge, Shield, Zap, TrendingUp,
  Wallet, CreditCard, ShieldCheck, Bell, Brain,
  Monitor, Globe, ChevronRight, Sparkles, Lock,
  Link2, Settings
} from 'lucide-react';

interface ProfileProps {
  prefs: UserPreferences;
  onUpdatePrefs: (partial: Partial<UserPreferences>) => void;
}

const chainOptions: { id: Chain; label: string }[] = [
  { id: 'ethereum', label: 'ETH' },
  { id: 'solana', label: 'SOL' },
  { id: 'bsc', label: 'BNB' },
  { id: 'polygon', label: 'MATIC' },
  { id: 'arbitrum', label: 'ARB' },
  { id: 'base', label: 'BASE' },
  { id: 'cronos', label: 'CRO' },
];

export default function Profile({ prefs, onUpdatePrefs }: ProfileProps) {
  const { t, lang, toggleLang } = useI18n();
  const navigate = useNavigate();
  const isAdmin = useAdminStatus();
  const { premium } = usePremium();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (id: string) =>
    setExpandedSection(prev => (prev === id ? null : id));

  const themeLabel = prefs.theme === 'dark' ? t('profile.dark') : t('profile.light');
  const modeLabel = prefs.mode === 'pro' ? t('onboarding.pro') : t('onboarding.simple');
  const riskLabels: Record<RiskProfile, string> = {
    conservative: t('onboarding.conservative'),
    standard: t('onboarding.standard'),
    aggressive: t('onboarding.aggressive'),
  };
  const activeChainCount = prefs.chains.length;

  return (
    <div className="min-h-screen">
      <main className="px-4 pt-2 pb-8 space-y-5 max-w-lg mx-auto">

        {/* Account */}
        <SettingsSection
          title={lang === 'fr' ? 'Compte' : 'Account'}
          trailing={
            premium.isPremium ? (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[hsl(42_95%_50%/0.15)] text-[hsl(42,95%,50%)] border border-[hsl(42_95%_50%/0.2)]">
                Premium
              </span>
            ) : (
              <button
                onClick={() => setShowUpgrade(true)}
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 transition-colors hover:bg-primary/20"
              >
                Upgrade
              </button>
            )
          }
        >
          <SettingsRow
            type="nav"
            icon={Wallet}
            label={lang === 'fr' ? 'Wallet connecté' : 'Connected Wallet'}
            subtitle={premium.walletAddress
              ? `${premium.walletAddress.slice(0, 6)}…${premium.walletAddress.slice(-4)}`
              : lang === 'fr' ? 'Non connecté' : 'Not connected'}
            onTap={() => setShowUpgrade(true)}
          />
          <SettingsRow
            type="nav"
            icon={CreditCard}
            label={lang === 'fr' ? 'Abonnement' : 'Subscription'}
            subtitle={premium.isPremium
              ? (premium.source === 'subscription' ? '$9.99/wk' : premium.source === 'nft' ? 'NFT Access' : 'Voucher')
              : lang === 'fr' ? 'Gratuit' : 'Free'}
            trailing={!premium.isPremium ? (
              <Sparkles className="w-4 h-4 text-[hsl(42,95%,50%)]" />
            ) : undefined}
            onTap={() => !premium.isPremium && setShowUpgrade(true)}
          />
        </SettingsSection>

        {/* Appearance */}
        <SettingsSection title={t('profile.appearance')}>
          <SettingsRow
            type="custom"
            icon={prefs.theme === 'dark' ? Moon : Sun}
            label={lang === 'fr' ? 'Thème' : 'Theme'}
            onTap={() => toggleSection('theme')}
            trailing={
              <span className="text-[13px] text-muted-foreground mr-1">{themeLabel}</span>
            }
          />
          <AnimatePresence>
            {expandedSection === 'theme' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2 px-4 py-2.5 bg-accent/30">
                  {([
                    { id: 'light' as ThemeMode, label: t('profile.light'), icon: Sun },
                    { id: 'dark' as ThemeMode, label: t('profile.dark'), icon: Moon },
                  ]).map(th => (
                    <button
                      key={th.id}
                      onClick={() => { onUpdatePrefs({ theme: th.id }); setExpandedSection(null); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-all text-[13px] font-medium ${
                        prefs.theme === th.id
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'border-border/40 text-muted-foreground hover:border-border'
                      }`}
                    >
                      <th.icon className="w-4 h-4" />
                      {th.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <SettingsRow
            type="custom"
            icon={prefs.mode === 'pro' ? Gauge : Eye}
            label={t('profile.displayMode')}
            onTap={() => toggleSection('mode')}
            trailing={
              <span className="text-[13px] text-muted-foreground mr-1">{modeLabel}</span>
            }
          />
          <AnimatePresence>
            {expandedSection === 'mode' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2 px-4 py-2.5 bg-accent/30">
                  {([
                    { id: 'simple' as const, label: t('onboarding.simple'), icon: Eye },
                    { id: 'pro' as const, label: t('onboarding.pro'), icon: Gauge },
                  ]).map(m => (
                    <button
                      key={m.id}
                      onClick={() => { onUpdatePrefs({ mode: m.id }); setExpandedSection(null); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-all text-[13px] font-medium ${
                        prefs.mode === m.id
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'border-border/40 text-muted-foreground hover:border-border'
                      }`}
                    >
                      <m.icon className="w-4 h-4" />
                      {m.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </SettingsSection>

        {/* Preferences */}
        <SettingsSection title={lang === 'fr' ? 'Préférences' : 'Preferences'}>
          <SettingsRow
            type="custom"
            icon={Shield}
            label={t('profile.riskProfile')}
            onTap={() => toggleSection('risk')}
            trailing={
              <span className="text-[13px] text-muted-foreground mr-1">{riskLabels[prefs.riskProfile]}</span>
            }
          />
          <AnimatePresence>
            {expandedSection === 'risk' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2 px-4 py-2.5 bg-accent/30">
                  {(['conservative', 'standard', 'aggressive'] as const).map(r => {
                    const icons = { conservative: Shield, standard: Zap, aggressive: TrendingUp };
                    const RIcon = icons[r];
                    return (
                      <button
                        key={r}
                        onClick={() => { onUpdatePrefs({ riskProfile: r }); setExpandedSection(null); }}
                        className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border transition-all text-[11px] font-medium ${
                          prefs.riskProfile === r
                            ? 'border-primary/40 bg-primary/10 text-primary'
                            : 'border-border/40 text-muted-foreground hover:border-border'
                        }`}
                      >
                        <RIcon className="w-4 h-4" />
                        {riskLabels[r]}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <SettingsRow
            type="custom"
            icon={Globe}
            label={t('profile.activeChains')}
            onTap={() => toggleSection('chains')}
            trailing={
              <span className="text-[13px] text-muted-foreground mr-1">{activeChainCount}/7</span>
            }
          />
          <AnimatePresence>
            {expandedSection === 'chains' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 px-4 py-3 bg-accent/30">
                  {chainOptions.map(c => (
                    <button
                      key={c.id}
                      onClick={() => {
                        const next = prefs.chains.includes(c.id)
                          ? prefs.chains.filter(x => x !== c.id)
                          : [...prefs.chains, c.id];
                        onUpdatePrefs({ chains: next });
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-[12px] font-semibold transition-all ${
                        prefs.chains.includes(c.id)
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'border-border/40 text-muted-foreground hover:border-border'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <SettingsRow
            type="custom"
            icon={Link2}
            label={lang === 'fr' ? 'Langue' : 'Language'}
            onTap={toggleLang}
            trailing={
              <span className="text-[13px] font-semibold text-primary mr-1">{lang.toUpperCase()}</span>
            }
          />
        </SettingsSection>

        {/* Advanced */}
        <SettingsSection title={lang === 'fr' ? 'Avancé' : 'Advanced'}>
          <SettingsRow
            type="nav"
            icon={Bell}
            label={lang === 'fr' ? 'Règles d\'alertes' : 'Alert Rules'}
            onTap={() => navigate('/alert-rules')}
          />
          <SettingsRow
            type="nav"
            icon={Brain}
            label={lang === 'fr' ? 'Assistant IA' : 'AI Assistant'}
            subtitle={premium.isPremium
              ? (lang === 'fr' ? 'Illimité' : 'Unlimited')
              : (lang === 'fr' ? '1 analyse/jour' : '1 insight/day')}
            onTap={() => {}}
          />
          {isAdmin && (
            <SettingsRow
              type="nav"
              icon={ShieldCheck}
              label="Administration"
              onTap={() => navigate('/admin')}
              trailing={
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">
                  Admin
                </span>
              }
            />
          )}
        </SettingsSection>

        {/* Footer */}
        <div className="text-center text-[10px] text-muted-foreground/40 pt-2 pb-4 space-y-0.5 font-mono">
          <p>ORACLE v1.0 — by The Flippin' Labs</p>
          <p>{t('profile.disclaimer')}</p>
        </div>
      </main>

      <PremiumUpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
