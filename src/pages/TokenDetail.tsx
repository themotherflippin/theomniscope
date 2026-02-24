import { useParams, useNavigate } from 'react-router-dom';
import { useMarketData } from '@/hooks/useMarketData';
import { MiniChart } from '@/components/MiniChart';
import { SignalCard } from '@/components/SignalCard';
import { RiskPanel } from '@/components/RiskPanel';
import { Disclaimer } from '@/components/Disclaimer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  formatPrice,
  formatPct,
  formatNumber,
  shortenAddress,
  chainLabel,
  dexLabel,
} from '@/lib/formatters';
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  TrendingUp,
  BarChart3,
  Users,
  Clock,
  Activity,
} from 'lucide-react';

export default function TokenDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tokens, signals, risks } = useMarketData();

  const token = tokens.find(t => t.id === id);
  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Token not found</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>
      </div>
    );
  }

  const risk = risks.get(token.id);
  const tokenSignals = signals.filter(s => s.tokenId === token.id);
  const positive = token.priceChange24h >= 0;

  return (
    <div className="min-h-screen bg-background">
      <Disclaimer />

      {/* Header */}
      <header className="border-b border-border px-6 py-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">{token.symbol}</h1>
            <span className="text-sm text-muted-foreground">{token.name}</span>
            <Badge variant="outline" className="text-[10px] font-mono">
              {chainLabel(token.chain)} · {dexLabel(token.dex)}
            </Badge>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-mono text-muted-foreground"
              onClick={() => navigator.clipboard.writeText(token.address)}
            >
              <Copy className="w-3 h-3 mr-1" />
              {shortenAddress(token.address)}
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6">
        {/* Price + Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <div className="gradient-card rounded-lg p-4">
              <div className="flex items-baseline gap-4 mb-4">
                <span className="text-3xl font-bold font-mono text-foreground">
                  {formatPrice(token.price)}
                </span>
                <span className={`text-lg font-mono font-semibold ${positive ? 'text-success' : 'text-danger'}`}>
                  {formatPct(token.priceChange24h)}
                </span>
              </div>
              <MiniChart basePrice={token.price} height={250} positive={positive} />
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-4">
            <div className="gradient-card rounded-lg p-4">
              <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Key Metrics</h3>
              <div className="space-y-3">
                {[
                  { icon: BarChart3, label: 'Volume 24h', value: formatNumber(token.volume24h) },
                  { icon: TrendingUp, label: 'Liquidity', value: formatNumber(token.liquidity) },
                  { icon: Activity, label: 'Market Cap', value: formatNumber(token.marketCap) },
                  { icon: Users, label: 'Holders', value: token.holders.toLocaleString() },
                  { icon: Clock, label: 'Age', value: `${Math.floor(token.ageHours / 24)}d ${Math.floor(token.ageHours % 24)}h` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-xs">{label}</span>
                    </div>
                    <span className="text-xs font-mono text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="gradient-card rounded-lg p-4">
              <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Indicators</h3>
              <div className="space-y-2">
                {[
                  { label: 'RSI', value: token.rsi.toFixed(0), warn: token.rsi > 70 || token.rsi < 30 },
                  { label: 'EMA20', value: formatPrice(token.ema20) },
                  { label: 'EMA50', value: formatPrice(token.ema50) },
                  { label: 'VWAP', value: formatPrice(token.vwap) },
                  { label: 'ATR', value: formatPrice(token.atr) },
                  { label: 'Volatility', value: `${token.volatility.toFixed(0)}%` },
                  { label: 'Buy/Sell', value: `${token.buyCount}/${token.sellCount}` },
                ].map(({ label, value, warn }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className={`text-xs font-mono ${warn ? 'text-warning' : 'text-foreground'}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Signals + Risk */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Signals ({tokenSignals.length})
            </h2>
            {tokenSignals.length === 0 ? (
              <p className="text-sm text-muted-foreground gradient-card rounded-lg p-8 text-center">
                No active signals for this token.
              </p>
            ) : (
              tokenSignals.map(sig => (
                <SignalCard key={sig.id} signal={sig} />
              ))
            )}
          </div>

          <div>
            {risk && <RiskPanel token={token} risk={risk} />}
          </div>
        </div>
      </main>
    </div>
  );
}
