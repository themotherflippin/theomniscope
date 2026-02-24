import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarketData } from '@/hooks/useMarketData';
import { TokenCard } from '@/components/TokenCard';
import { Button } from '@/components/ui/button';
import { Star, Plus, Layers } from 'lucide-react';

type WatchlistTab = 'favorites' | 'scalp' | 'swing' | 'observations';

const tabs: { id: WatchlistTab; label: string }[] = [
  { id: 'favorites', label: '⭐ Favoris' },
  { id: 'scalp', label: '⚡ Scalp' },
  { id: 'swing', label: '📈 Swing' },
  { id: 'observations', label: '👀 Observations' },
];

export default function Watchlists() {
  const navigate = useNavigate();
  const { tokens, risks } = useMarketData();
  const [activeTab, setActiveTab] = useState<WatchlistTab>('favorites');

  // For demo, favorites = tokens with isFavorite
  const favorites = tokens.filter(t => t.isFavorite);
  // Others are empty placeholders for now
  const listTokens = activeTab === 'favorites' ? favorites : [];

  return (
    <div>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2 mb-3">
          <Layers className="w-5 h-5 text-primary" />
          Watchlists
        </h1>
        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === t.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 py-4">
        {listTokens.length === 0 ? (
          <div className="text-center py-16">
            <Star className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {activeTab === 'favorites'
                ? 'Aucun favori. Ajoute des tokens depuis le Radar !'
                : 'Cette liste est vide pour le moment.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {listTokens.map(t => (
              <TokenCard
                key={t.id}
                token={t}
                risk={risks.get(t.id)}
                onSelect={() => navigate(`/token/${t.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
