import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarketData } from '@/hooks/useMarketData';
import { TokenCard } from '@/components/TokenCard';
import { TokenTable } from '@/components/TokenTable';
import { RiskBadge } from '@/components/RiskBadge';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatPrice, formatPct, formatNumber } from '@/lib/formatters';
import type { UserPreferences } from '@/lib/userPreferences';
import type { Chain } from '@/lib/types';
import {
  Search, TrendingUp, TrendingDown, Flame, ShieldAlert,
  SlidersHorizontal, X
} from 'lucide-react';

interface RadarProps {
  prefs: UserPreferences;
}

type QuickFilter = 'all' | 'eth' | 'bsc' | 'arb' | 'poly' | 'base';
const chainFilterMap: Record<QuickFilter, Chain | null> = {
  all: null, eth: 'ethereum', bsc: 'bsc', arb: 'arbitrum', poly: 'polygon', base: 'base',
};

export default function Radar({ prefs }: RadarProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { tokens, risks, signals } = useMarketData();
  const [search, setSearch] = useState('');
  const [chainFilter, setChainFilter] = useState<QuickFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = tokens.filter(t => {
    if (search && !t.symbol.toLowerCase().includes(search.toLowerCase()) && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (chainFilter !== 'all' && t.chain !== chainFilterMap[chainFilter]) return false;
    if (!prefs.chains.includes(t.chain)) return false;
    return true;
  });

  const topGainers = [...filtered].sort((a, b) => b.priceChange1h - a.priceChange1h).slice(0, 5);
  const topLosers = [...filtered].sort((a, b) => a.priceChange1h - b.priceChange1h).slice(0, 5);
  const newTokens = [...filtered].sort((a, b) => a.ageHours - b.ageHours).slice(0, 5);
  const highRisk = filtered.filter(t => {
    const r = risks.get(t.id);
    return r && r.score >= 50;
  }).sort((a, b) => (risks.get(b.id)?.score || 0) - (risks.get(a.id)?.score || 0)).slice(0, 5);

  const isPro = prefs.mode === 'pro';

  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 mb-3">
          <h1 className="text-lg font-bold text-foreground flex-1">🔍 Radar</h1>
          <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary animate-pulse-glow">
            LIVE
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Symbole ou adresse..."
              className="pl-9 h-9 text-sm bg-secondary border-border"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
        {/* Quick chain filter */}
        <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-thin pb-1">
          {(['all', 'eth', 'bsc', 'arb', 'poly', 'base'] as QuickFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setChainFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                chainFilter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              {f === 'all' ? 'Toutes' : f.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 py-4 space-y-6">
        {/* Top Gainers/Losers */}
        <section>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-success" />
            Top Gainers 1h
          </h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-2">
            {topGainers.map(t => (
              <button
                key={t.id}
                onClick={() => navigate(`/token/${t.id}`)}
                className="gradient-card rounded-xl p-3 min-w-[140px] flex-shrink-0 text-left active:scale-95 transition-transform"
              >
                <p className="font-bold text-foreground text-sm">{t.symbol}</p>
                <p className="font-mono text-xs text-foreground mt-1">{formatPrice(t.price)}</p>
                <p className="font-mono text-xs text-success mt-0.5">{formatPct(t.priceChange1h)}</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-danger" />
            Top Losers 1h
          </h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-2">
            {topLosers.map(t => (
              <button
                key={t.id}
                onClick={() => navigate(`/token/${t.id}`)}
                className="gradient-card rounded-xl p-3 min-w-[140px] flex-shrink-0 text-left active:scale-95 transition-transform"
              >
                <p className="font-bold text-foreground text-sm">{t.symbol}</p>
                <p className="font-mono text-xs text-foreground mt-1">{formatPrice(t.price)}</p>
                <p className="font-mono text-xs text-danger mt-0.5">{formatPct(t.priceChange1h)}</p>
              </button>
            ))}
          </div>
        </section>

        {/* New Tokens */}
        <section>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-warning" />
            Nouveaux Tokens
          </h2>
          <div className="space-y-0 gradient-card rounded-xl overflow-hidden">
            {newTokens.map(t => (
              <TokenCard
                key={t.id}
                token={t}
                risk={risks.get(t.id)}
                onSelect={() => navigate(`/token/${t.id}`)}
                compact
              />
            ))}
          </div>
        </section>

        {/* High Risk */}
        {highRisk.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <ShieldAlert className="w-4 h-4 text-danger" />
              Risque Élevé
            </h2>
            <div className="space-y-0 gradient-card rounded-xl overflow-hidden">
              {highRisk.map(t => (
                <TokenCard
                  key={t.id}
                  token={t}
                  risk={risks.get(t.id)}
                  onSelect={() => navigate(`/token/${t.id}`)}
                  compact
                />
              ))}
            </div>
          </section>
        )}

        {/* All tokens */}
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Tous les tokens ({filtered.length})
          </h2>
          {isMobile ? (
            <div className="space-y-3">
              {filtered.map(t => (
                <TokenCard
                  key={t.id}
                  token={t}
                  risk={risks.get(t.id)}
                  onSelect={() => navigate(`/token/${t.id}`)}
                  showChain={isPro}
                />
              ))}
            </div>
          ) : (
            <TokenTable
              tokens={filtered}
              risks={risks}
              onSelect={t => navigate(`/token/${t.id}`)}
            />
          )}
        </section>
      </main>
    </div>
  );
}
