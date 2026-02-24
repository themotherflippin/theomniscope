import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarketData } from '@/hooks/useMarketData';
import { SignalCard } from '@/components/SignalCard';
import { Badge } from '@/components/ui/badge';
import type { UserPreferences } from '@/lib/userPreferences';
import type { SignalType } from '@/lib/types';
import { Zap, Eye, ShieldAlert, Clock } from 'lucide-react';

interface OppsProps {
  prefs: UserPreferences;
}

type Filter = 'all' | 'ENTRY' | 'EXIT' | 'HOLD' | 'AVOID';

export default function Opportunities({ prefs }: OppsProps) {
  const navigate = useNavigate();
  const { signals, opportunities } = useMarketData();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = filter === 'all'
    ? signals
    : signals.filter(s => s.type === filter);

  // Sort by quality: high confidence first, then low risk
  const sorted = [...filtered].sort((a, b) => {
    const confOrder = { high: 0, medium: 1, low: 2 };
    const confDiff = confOrder[a.confidence] - confOrder[b.confidence];
    if (confDiff !== 0) return confDiff;
    return a.riskScore - b.riskScore;
  });

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'Tous', count: signals.length },
    { id: 'ENTRY', label: 'Entry', count: signals.filter(s => s.type === 'ENTRY').length },
    { id: 'EXIT', label: 'Exit', count: signals.filter(s => s.type === 'EXIT').length },
    { id: 'HOLD', label: 'Hold', count: signals.filter(s => s.type === 'HOLD').length },
    { id: 'AVOID', label: 'Avoid', count: signals.filter(s => s.type === 'AVOID').length },
  ];

  return (
    <div>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-success" />
          Opportunités
          <Badge variant="outline" className="text-[10px] font-mono ml-auto">
            {signals.length} signaux
          </Badge>
        </h1>
        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filter === f.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 py-4">
        {sorted.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aucun signal détecté pour le moment.</p>
            <p className="text-xs text-muted-foreground mt-1">Le scanner analyse en continu.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map(sig => (
              <SignalCard
                key={sig.id}
                signal={sig}
                onClick={() => navigate(`/token/${sig.tokenId}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
