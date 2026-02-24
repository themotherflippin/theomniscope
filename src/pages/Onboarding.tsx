import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Chain } from '@/lib/types';
import type { UserMode, RiskProfile, UserPreferences } from '@/lib/userPreferences';
import {
  Zap, Shield, Eye, Gauge,
  ChevronRight, ChevronLeft,
  Bell, TrendingUp, ShieldAlert, BarChart3,
  Radar as RadarIcon,
} from 'lucide-react';

interface OnboardingProps {
  onComplete: (prefs: Partial<UserPreferences>) => void;
}

const chains: { id: Chain; label: string; icon: string }[] = [
  { id: 'ethereum', label: 'Ethereum', icon: 'Ξ' },
  { id: 'bsc', label: 'BNB Chain', icon: 'B' },
  { id: 'polygon', label: 'Polygon', icon: 'P' },
  { id: 'arbitrum', label: 'Arbitrum', icon: 'A' },
  { id: 'base', label: 'Base', icon: '◆' },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<UserMode>('simple');
  const [risk, setRisk] = useState<RiskProfile>('standard');
  const [selectedChains, setSelectedChains] = useState<Chain[]>(['ethereum', 'bsc', 'arbitrum', 'polygon', 'base']);
  const [alertTypes, setAlertTypes] = useState<string[]>(['signal', 'risk']);

  const toggleChain = (c: Chain) => {
    setSelectedChains(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  };

  const toggleAlert = (a: string) => {
    setAlertTypes(prev =>
      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
    );
  };

  const finish = () => {
    onComplete({
      mode,
      riskProfile: risk,
      chains: selectedChains,
      alertTypes: alertTypes as any,
      onboardingComplete: true,
    });
  };

  const steps = [
    // Step 1: Mode
    <div key="mode" className="space-y-6">
      <div className="text-center space-y-2">
        <RadarIcon className="w-10 h-10 text-primary mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Choisis ton style</h2>
        <p className="text-sm text-muted-foreground">Tu pourras changer à tout moment</p>
      </div>
      <div className="grid gap-3">
        <button
          onClick={() => setMode('simple')}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            mode === 'simple'
              ? 'border-primary bg-primary/10'
              : 'border-border bg-card hover:border-muted-foreground/30'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <Eye className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Mode Simple</span>
            <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">Recommandé</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Signaux clairs, interface épurée. Idéal pour débuter.</p>
        </button>
        <button
          onClick={() => setMode('pro')}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            mode === 'pro'
              ? 'border-primary bg-primary/10'
              : 'border-border bg-card hover:border-muted-foreground/30'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <Gauge className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Mode Pro</span>
          </div>
          <p className="text-xs text-muted-foreground">Toutes les données, indicateurs techniques, risk scanner détaillé.</p>
        </button>
      </div>
    </div>,

    // Step 2: Risk
    <div key="risk" className="space-y-6">
      <div className="text-center space-y-2">
        <Shield className="w-10 h-10 text-primary mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Quel risque ?</h2>
        <p className="text-sm text-muted-foreground">Filtre les signaux selon ton profil</p>
      </div>
      <div className="grid gap-3">
        {([
          { id: 'conservative' as RiskProfile, label: 'Conservateur', desc: 'Signaux haute confiance uniquement. Tokens établis, risque faible.', icon: Shield, color: 'text-success' },
          { id: 'standard' as RiskProfile, label: 'Standard', desc: 'Bon équilibre risque/reward. Signaux moyens à forts.', icon: Zap, color: 'text-primary' },
          { id: 'aggressive' as RiskProfile, label: 'Agressif', desc: 'Tous les signaux, y compris les plus risqués. Pour traders expérimentés.', icon: TrendingUp, color: 'text-warning' },
        ]).map(r => (
          <button
            key={r.id}
            onClick={() => setRisk(r.id)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              risk === r.id
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card hover:border-muted-foreground/30'
            }`}
          >
            <div className="flex items-center gap-3 mb-1">
              <r.icon className={`w-5 h-5 ${r.color}`} />
              <span className="font-semibold text-foreground">{r.label}</span>
            </div>
            <p className="text-xs text-muted-foreground">{r.desc}</p>
          </button>
        ))}
      </div>
    </div>,

    // Step 3: Chains
    <div key="chains" className="space-y-6">
      <div className="text-center space-y-2">
        <BarChart3 className="w-10 h-10 text-primary mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Tes chaînes</h2>
        <p className="text-sm text-muted-foreground">Active les blockchains que tu veux suivre</p>
      </div>
      <div className="grid gap-3">
        {chains.map(c => (
          <button
            key={c.id}
            onClick={() => toggleChain(c.id)}
            className={`p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
              selectedChains.includes(c.id)
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card hover:border-muted-foreground/30'
            }`}
          >
            <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center font-bold text-foreground text-sm">
              {c.icon}
            </span>
            <span className="font-semibold text-foreground">{c.label}</span>
            {selectedChains.includes(c.id) && (
              <span className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-xs">✓</span>
              </span>
            )}
          </button>
        ))}
      </div>
    </div>,

    // Step 4: Alerts
    <div key="alerts" className="space-y-6">
      <div className="text-center space-y-2">
        <Bell className="w-10 h-10 text-primary mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Tes alertes</h2>
        <p className="text-sm text-muted-foreground">Choisis quand être notifié</p>
      </div>
      <div className="grid gap-3">
        {([
          { id: 'price', label: 'Prix', desc: 'Alerte quand un prix dépasse un seuil', icon: TrendingUp },
          { id: 'volume', label: 'Volume', desc: 'Spike de volume ou transactions inhabituelles', icon: BarChart3 },
          { id: 'signal', label: 'Signaux', desc: 'Nouveaux signaux Entry/Exit/Avoid', icon: Zap },
          { id: 'risk', label: 'Risque', desc: 'Changement de score de risque', icon: ShieldAlert },
        ]).map(a => (
          <button
            key={a.id}
            onClick={() => toggleAlert(a.id)}
            className={`p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
              alertTypes.includes(a.id)
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card hover:border-muted-foreground/30'
            }`}
          >
            <a.icon className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <span className="font-semibold text-foreground text-sm">{a.label}</span>
              <p className="text-xs text-muted-foreground">{a.desc}</p>
            </div>
            {alertTypes.includes(a.id) && (
              <span className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground text-xs">✓</span>
              </span>
            )}
          </button>
        ))}
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex gap-2">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`h-1 rounded-full flex-1 transition-all ${
                i <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Étape {step + 1} / 4
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-4 max-w-md mx-auto w-full">
        {steps[step]}
      </div>

      {/* Navigation */}
      <div className="px-6 pb-8 pt-4 flex gap-3 max-w-md mx-auto w-full">
        {step > 0 && (
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setStep(s => s - 1)}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Retour
          </Button>
        )}
        {step < 3 ? (
          <Button
            className="flex-1"
            onClick={() => setStep(s => s + 1)}
          >
            Suivant
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button className="flex-1" onClick={finish}>
            <Zap className="w-4 h-4 mr-1" />
            C'est parti !
          </Button>
        )}
      </div>
    </div>
  );
}
