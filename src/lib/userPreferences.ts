import { useState, useEffect, createContext, useContext } from 'react';
import type { Chain } from './types';

export type UserMode = 'simple' | 'pro';
export type RiskProfile = 'conservative' | 'standard' | 'aggressive';

export interface UserPreferences {
  mode: UserMode;
  riskProfile: RiskProfile;
  chains: Chain[];
  alertTypes: ('price' | 'volume' | 'signal' | 'risk')[];
  onboardingComplete: boolean;
}

const DEFAULT_PREFS: UserPreferences = {
  mode: 'simple',
  riskProfile: 'standard',
  chains: ['ethereum', 'bsc', 'arbitrum', 'polygon', 'base'],
  alertTypes: ['signal', 'risk'],
  onboardingComplete: false,
};

function loadPrefs(): UserPreferences {
  try {
    const stored = localStorage.getItem('omnidex_prefs');
    if (stored) return { ...DEFAULT_PREFS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_PREFS;
}

function savePrefs(prefs: UserPreferences) {
  localStorage.setItem('omnidex_prefs', JSON.stringify(prefs));
}

export function useUserPreferences() {
  const [prefs, setPrefs] = useState<UserPreferences>(loadPrefs);

  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  const updatePrefs = (partial: Partial<UserPreferences>) => {
    setPrefs(prev => ({ ...prev, ...partial }));
  };

  return { prefs, updatePrefs };
}
