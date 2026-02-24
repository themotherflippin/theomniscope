import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarketData } from '@/hooks/useMarketData';
import { TokenTable } from '@/components/TokenTable';
import { SignalCard } from '@/components/SignalCard';
import { AlertCenter } from '@/components/AlertCenter';
import { Disclaimer } from '@/components/Disclaimer';
import { RiskBadge } from '@/components/RiskBadge';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatPrice, formatPct, formatNumber } from '@/lib/formatters';
import {
  Activity,
  Search,
  Radar,
  Zap,
  ShieldAlert,
  TrendingUp,
  BarChart3,
  Eye
} from 'lucide-react';

type Tab = 'radar' | 'signals' | 'risks';

const Index = () => {
  const navigate = useNavigate();
  const {
    tokens,
    signals,
    risks,
    alerts,
    opportunities,
    highRiskTokens,
    unreadAlerts,
    markAlertRead,
    markAllRead,
  } = useMarketData();

  const [activeTab, setActiveTab] = useState<Tab>('radar');
  const [search, setSearch] = useState('');

  const filteredTokens = tokens.filter(t =>
    t.symbol.toLowerCase().includes(search.toLowerCase()) ||
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'radar', label: 'Market Radar', icon: Radar },
    { id: 'signals', label: 'Opportunities', icon: Zap },
    { id: 'risks', label: 'High Risk', icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Disclaimer />

      {/* Header */}
      <header className="border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground tracking-tight">
                DEX Tracker
              </h1>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
              LIVE
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search token or address..."
                className="w-64 pl-9 h-8 text-xs bg-secondary border-border"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <AlertCenter
              alerts={alerts}
              unreadCount={unreadAlerts}
              onMarkRead={markAlertRead}
              onMarkAllRead={markAllRead}
            />
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="border-b border-border px-6 py-2 flex items-center gap-6 text-xs">
        <div className="flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Tokens:</span>
          <span className="font-mono text-foreground">{tokens.length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-success" />
          <span className="text-muted-foreground">Signals:</span>
          <span className="font-mono text-foreground">{signals.length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-primary" />
          <span className="text-muted-foreground">Opportunities:</span>
          <span className="font-mono text-success">{opportunities.length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-danger" />
          <span className="text-muted-foreground">High Risk:</span>
          <span className="font-mono text-danger">{highRiskTokens.length}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border px-6">
        <div className="flex gap-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main className="p-6">
        {activeTab === 'radar' && (
          <TokenTable
            tokens={filteredTokens}
            risks={risks}
            onSelect={token => navigate(`/token/${token.id}`)}
            title="Live Market — All Tokens"
          />
        )}

        {activeTab === 'signals' && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-success" />
              Active Signals ({opportunities.length})
            </h2>
            {opportunities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">No active opportunities detected.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {opportunities.map(sig => (
                  <SignalCard
                    key={sig.id}
                    signal={sig}
                    onClick={() => navigate(`/token/${sig.tokenId}`)}
                  />
                ))}
              </div>
            )}

            {signals.filter(s => s.type === 'EXIT').length > 0 && (
              <>
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mt-8">
                  <Eye className="w-4 h-4 text-danger" />
                  Exit Signals
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {signals.filter(s => s.type === 'EXIT').map(sig => (
                    <SignalCard
                      key={sig.id}
                      signal={sig}
                      onClick={() => navigate(`/token/${sig.tokenId}`)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'risks' && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-danger" />
              High Risk Tokens ({highRiskTokens.length})
            </h2>
            <div className="gradient-card rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground text-xs border-b border-border">
                    <th className="text-left px-4 py-2 font-medium">Token</th>
                    <th className="text-right px-3 py-2 font-medium">Price</th>
                    <th className="text-right px-3 py-2 font-medium">24h</th>
                    <th className="text-center px-3 py-2 font-medium">Risk</th>
                    <th className="text-left px-3 py-2 font-medium">Top Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {highRiskTokens.map(({ token, risk }) => (
                    <tr
                      key={token.id}
                      onClick={() => navigate(`/token/${token.id}`)}
                      className="border-b border-border/50 hover:bg-accent/50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-2.5 font-semibold text-foreground">{token.symbol}</td>
                      <td className="text-right px-3 py-2.5 font-mono text-foreground text-xs">
                        {formatPrice(token.price)}
                      </td>
                      <td className={`text-right px-3 py-2.5 font-mono text-xs ${token.priceChange24h >= 0 ? 'text-success' : 'text-danger'}`}>
                        {formatPct(token.priceChange24h)}
                      </td>
                      <td className="text-center px-3 py-2.5">
                        <RiskBadge score={risk.score} level={risk.level} />
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">
                        {risk.flags.slice(0, 2).map(f => f.label).join(' · ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
