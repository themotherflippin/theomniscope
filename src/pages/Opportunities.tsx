import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarketData } from '@/hooks/useMarketData';
import { OpportunityCard } from '@/components/OpportunityCard';
import { Badge } from '@/components/ui/badge';
import type { UserPreferences } from '@/lib/userPreferences';
import { Zap, Clock, Shield, Filter } from 'lucide-react';

interface OppsProps {
  prefs: UserPreferences;
}

type Filter = 'all' | 'STRONG_BUY' | 'BUY' | 'WATCH' | 'AVOID';
type SortMode = 'score' | 'risk' | 'momentum';

export default function Opportunities({ prefs }: OppsProps) {
  const navigate = useNavigate();
  const { oppScores } = useMarketData();
  const [filter, setFilter] = useState<Filter>('all');
  const [safeOnly, setSafeOnly] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('score');

  let filtered = filter === 'all'
    ? oppScores
    : oppScores.filter(o => o.action === filter);

  // Safe-only mode: hide anything capped or AVOID
  if (safeOnly) {
    filtered = filtered.filter(o => !o.capped && o.action !== 'AVOID' && o.totalScore >= 35);
  }

  // Sort
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

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: oppScores.length },
    { id: 'STRONG_BUY', label: 'Strong', count: oppScores.filter(o => o.action === 'STRONG_BUY').length },
    { id: 'BUY', label: 'Buy', count: oppScores.filter(o => o.action === 'BUY').length },
    { id: 'WATCH', label: 'Watch', count: oppScores.filter(o => o.action === 'WATCH').length },
    { id: 'AVOID', label: 'Avoid', count: oppScores.filter(o => o.action === 'AVOID').length },
  ];

  return (
    <div>
      <header className="sticky top-0 z-40 glass-strong border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-primary" />
          <h1 className="text-base font-display font-bold text-foreground tracking-tight flex-1">Opportunities</h1>
          <button
            onClick={() => setSafeOnly(!safeOnly)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
              safeOnly
                ? 'bg-success/10 text-success border border-success/20'
                : 'bg-secondary/50 text-muted-foreground border border-transparent'
            }`}
          >
            <Shield className="w-3 h-3" />
            Safe Only
          </button>
        </div>

        {/* Sort buttons */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px] text-muted-foreground mr-1">Sort:</span>
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
              {safeOnly ? 'No safe opportunities right now.' : 'No opportunities detected.'}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {safeOnly
                ? 'Market conditions may not favor safe entries — patience is a strategy.'
                : 'Scanner running continuously.'}
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
