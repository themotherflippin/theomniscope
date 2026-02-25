import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMarketData } from '@/hooks/useMarketData';
import { OpportunityCard } from '@/components/OpportunityCard';
import { useI18n } from '@/lib/i18n';
import type { UserPreferences } from '@/lib/userPreferences';
import { Zap, Clock, Shield } from 'lucide-react';

interface OppsProps {
  prefs: UserPreferences;
}

type FilterType = 'all' | 'STRONG_BUY' | 'BUY' | 'WATCH' | 'AVOID';
type SortMode = 'score' | 'risk' | 'momentum';

export default function Opportunities({ prefs }: OppsProps) {
  const navigate = useNavigate();
  const { oppScores } = useMarketData();
  const [filter, setFilter] = useState<FilterType>('all');
  const [safeOnly, setSafeOnly] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('score');
  const { t } = useI18n();

  let filtered = filter === 'all'
    ? oppScores
    : oppScores.filter(o => o.action === filter);

  if (safeOnly) {
    filtered = filtered.filter(o => !o.capped && o.action !== 'AVOID' && o.totalScore >= 35);
  }

  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === 'score') return b.totalScore - a.totalScore;
    if (sortMode === 'risk') {
      const riskA = a.factors.find(f => f.category === 'risk')?.score || 0;
      const riskB = b.factors.find(f => f.category === 'risk')?.score || 0;
      return riskB - riskA;
    }
    const momA = a.factors.find(f => f.category === 'momentum')?.score || 0;
    const momB = b.factors.find(f => f.category === 'momentum')?.score || 0;
    return momB - momA;
  });

  const filters: { id: FilterType; label: string; count: number }[] = [
    { id: 'all', label: t('opps.all'), count: oppScores.length },
    { id: 'STRONG_BUY', label: t('opps.strong'), count: oppScores.filter(o => o.action === 'STRONG_BUY').length },
    { id: 'BUY', label: t('opps.buy'), count: oppScores.filter(o => o.action === 'BUY').length },
    { id: 'WATCH', label: t('opps.watch'), count: oppScores.filter(o => o.action === 'WATCH').length },
    { id: 'AVOID', label: t('opps.avoid'), count: oppScores.filter(o => o.action === 'AVOID').length },
  ];

  return (
    <div>
      <header className="sticky top-0 z-40 glass-strong border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-primary" />
          <h1 className="text-base font-display font-bold text-foreground tracking-tight flex-1">{t('opps.title')}</h1>
          <button
            onClick={() => setSafeOnly(!safeOnly)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
              safeOnly
                ? 'bg-success/10 text-success border border-success/20'
                : 'bg-secondary/50 text-muted-foreground border border-transparent'
            }`}
          >
            <Shield className="w-3 h-3" />
            {t('opps.safeOnly')}
          </button>
        </div>

        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px] text-muted-foreground mr-1">{t('opps.sort')}</span>
          {(['score', 'risk', 'momentum'] as SortMode[]).map(s => (
            <button
              key={s}
              onClick={() => setSortMode(s)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                sortMode === s ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                filter === f.id
                  ? 'bg-primary/15 text-primary border border-primary/20'
                  : 'bg-secondary/50 text-muted-foreground border border-transparent'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 py-4">
        {sorted.length === 0 ? (
          <div className="text-center py-20">
            <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {safeOnly ? t('opps.noSafe') : t('opps.none')}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {safeOnly ? t('opps.noSafeHint') : t('opps.noneHint')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((opp, i) => (
              <motion.div
                key={opp.tokenId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <OpportunityCard
                  opp={opp}
                  onClick={() => navigate(`/token/${opp.tokenId}`)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
