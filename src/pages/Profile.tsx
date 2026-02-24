import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { UserPreferences } from '@/lib/userPreferences';
import type { Chain } from '@/lib/types';
import {
  User, Eye, Gauge, Shield, Zap, TrendingUp,
  RotateCcw, ChevronRight
} from 'lucide-react';

interface ProfileProps {
  prefs: UserPreferences;
  onUpdatePrefs: (partial: Partial<UserPreferences>) => void;
}

export default function Profile({ prefs, onUpdatePrefs }: ProfileProps) {
  const riskLabels = { conservative: 'Conservateur', standard: 'Standard', aggressive: 'Agressif' };
  const chainLabels: Record<Chain, string> = {
    ethereum: 'Ethereum',
    bsc: 'BNB Chain',
    polygon: 'Polygon',
    arbitrum: 'Arbitrum',
    base: 'Base',
  };

  return (
    <div>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Profil & Préférences
        </h1>
      </header>

      <main className="px-4 py-4 space-y-6 max-w-lg mx-auto">
        {/* Mode toggle */}
        <section className="gradient-card rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Mode d'affichage</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onUpdatePrefs({ mode: 'simple' })}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                prefs.mode === 'simple'
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card'
              }`}
            >
              <Eye className="w-5 h-5 mx-auto text-primary mb-1" />
              <span className="text-xs font-semibold text-foreground">Simple</span>
            </button>
            <button
              onClick={() => onUpdatePrefs({ mode: 'pro' })}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                prefs.mode === 'pro'
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card'
              }`}
            >
              <Gauge className="w-5 h-5 mx-auto text-primary mb-1" />
              <span className="text-xs font-semibold text-foreground">Pro</span>
            </button>
          </div>
        </section>

        {/* Risk profile */}
        <section className="gradient-card rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Profil de risque</h3>
          <div className="grid grid-cols-3 gap-2">
            {(['conservative', 'standard', 'aggressive'] as const).map(r => (
              <button
                key={r}
                onClick={() => onUpdatePrefs({ riskProfile: r })}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  prefs.riskProfile === r
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card'
                }`}
              >
                <span className="text-xs font-semibold text-foreground">{riskLabels[r]}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Chains */}
        <section className="gradient-card rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Chaînes actives</h3>
          <div className="space-y-2">
            {(['ethereum', 'bsc', 'polygon', 'arbitrum', 'base'] as Chain[]).map(c => (
              <button
                key={c}
                onClick={() => {
                  const newChains = prefs.chains.includes(c)
                    ? prefs.chains.filter(x => x !== c)
                    : [...prefs.chains, c];
                  onUpdatePrefs({ chains: newChains });
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                  prefs.chains.includes(c)
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border bg-card'
                }`}
              >
                <span className="text-sm text-foreground">{chainLabels[c]}</span>
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  prefs.chains.includes(c)
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground'
                }`}>
                  {prefs.chains.includes(c) && <span className="text-primary-foreground text-[10px]">✓</span>}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Reset onboarding */}
        <section className="gradient-card rounded-xl p-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onUpdatePrefs({ onboardingComplete: false })}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Refaire l'onboarding
          </Button>
        </section>

        {/* Info */}
        <div className="text-center text-xs text-muted-foreground pb-8">
          <p>OmniDEX Tracker v1.0</p>
          <p className="mt-1">Information only, not financial advice.</p>
        </div>
      </main>
    </div>
  );
}
