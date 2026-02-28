import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MiniChart } from '@/components/MiniChart';
import { useI18n } from '@/lib/i18n';
import { formatPrice, formatNumber, formatPct, shortenAddress } from '@/lib/formatters';
import { supabase } from '@/integrations/supabase/client';
import {
  Eye, Search, Copy, Shield, ShieldAlert, ShieldCheck, Users,
  BarChart3, Droplets, Clock, TrendingUp, Activity, Loader2,
  AlertTriangle, CheckCircle, XCircle, Wallet, ArrowLeftRight
} from 'lucide-react';

interface LookupResult {
  address: string;
  symbol: string;
  name: string;
  chain: string;
  dex: string;
  price: number;
  priceChange1h: number;
  priceChange24h: number;
  priceChange5m: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
  txCount24h: number;
  buyCount: number;
  sellCount: number;
  ageHours: number;
  pairAddress: string;
  // Risk indicators derived from real data
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFlags: { label: string; severity: string }[];
}

function computeRisk(pair: any): { score: number; level: string; flags: { label: string; severity: string }[] } {
  const flags: { label: string; severity: string }[] = [];
  let score = 0;

  const liq = pair.liquidity?.usd || 0;
  const vol = pair.volume?.h24 || 0;
  const mc = pair.marketCap || pair.fdv || 0;
  const age = pair.pairCreatedAt ? (Date.now() - pair.pairCreatedAt) / 3600000 : 999;
  const buys = pair.txns?.h24?.buys || 0;
  const sells = pair.txns?.h24?.sells || 0;

  // Liquidity check
  if (liq < 5000) { score += 30; flags.push({ label: `Very low liquidity ($${formatNumber(liq)})`, severity: 'critical' }); }
  else if (liq < 50000) { score += 15; flags.push({ label: `Low liquidity ($${formatNumber(liq)})`, severity: 'warning' }); }

  // Volume/liquidity ratio
  if (liq > 0 && vol / liq > 10) { score += 10; flags.push({ label: 'Suspicious volume/liquidity ratio', severity: 'warning' }); }

  // Age check
  if (age < 1) { score += 20; flags.push({ label: 'Token created less than 1 hour ago', severity: 'danger' }); }
  else if (age < 24) { score += 10; flags.push({ label: 'Token less than 24h old', severity: 'warning' }); }

  // Buy/sell imbalance
  const total = buys + sells;
  if (total > 10) {
    const sellPct = sells / total;
    if (sellPct > 0.8) { score += 15; flags.push({ label: 'Heavy sell pressure (>80% sells)', severity: 'danger' }); }
  }

  // Market cap check
  if (mc > 0 && mc < 10000) { score += 10; flags.push({ label: 'Extremely low market cap', severity: 'warning' }); }

  // No transactions
  if (total === 0) { score += 20; flags.push({ label: 'No transactions in 24h', severity: 'danger' }); }

  score = Math.min(score, 100);
  const level = score < 25 ? 'low' : score < 50 ? 'medium' : score < 70 ? 'high' : 'critical';

  if (score < 25 && flags.length === 0) {
    flags.push({ label: 'No major risks detected', severity: 'info' });
  }

  return { score, level, flags };
}

function mapChainId(chainId: string): string {
  const map: Record<string, string> = {
    ethereum: 'ethereum', eth: 'ethereum', solana: 'solana', bsc: 'bsc',
    arbitrum: 'arbitrum', polygon: 'polygon', base: 'base', cronos: 'cronos',
    avalanche: 'avalanche', optimism: 'optimism',
  };
  return map[chainId?.toLowerCase()] || chainId || 'unknown';
}

function parsePairToResult(pair: any): LookupResult {
  const risk = computeRisk(pair);
  const age = pair.pairCreatedAt ? (Date.now() - pair.pairCreatedAt) / 3600000 : 0;

  return {
    address: pair.baseToken?.address || '',
    symbol: pair.baseToken?.symbol || 'UNKNOWN',
    name: pair.baseToken?.name || 'Unknown Token',
    chain: mapChainId(pair.chainId),
    dex: pair.dexId || 'Unknown DEX',
    price: parseFloat(pair.priceUsd || '0'),
    priceChange5m: pair.priceChange?.m5 || 0,
    priceChange1h: pair.priceChange?.h1 || 0,
    priceChange24h: pair.priceChange?.h24 || 0,
    volume24h: pair.volume?.h24 || 0,
    liquidity: pair.liquidity?.usd || 0,
    marketCap: pair.marketCap || pair.fdv || 0,
    txCount24h: (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0),
    buyCount: pair.txns?.h24?.buys || 0,
    sellCount: pair.txns?.h24?.sells || 0,
    ageHours: age,
    pairAddress: pair.pairAddress || '',
    riskScore: risk.score,
    riskLevel: risk.level as LookupResult['riskLevel'],
    riskFlags: risk.flags,
  };
}

function RiskMeter({ score }: { score: number }) {
  const color = score < 25 ? 'text-success' : score < 50 ? 'text-warning' : score < 70 ? 'text-orange-400' : 'text-danger';
  const bg = score < 25 ? 'bg-success' : score < 50 ? 'bg-warning' : score < 70 ? 'bg-orange-400' : 'bg-danger';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Risk Score</span>
        <span className={`font-mono text-sm font-bold ${color}`}>{score}/100</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full rounded-full ${bg}`}
        />
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon, color }: { label: string; value: string; icon?: React.ReactNode; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
      <span className="text-xs text-muted-foreground flex items-center gap-1.5">{icon}{label}</span>
      <span className={`text-xs font-mono font-medium ${color || 'text-foreground'}`}>{value}</span>
    </div>
  );
}

export default function Lookup() {
  const [searchParams] = useSearchParams();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const { t } = useI18n();

  // Read query param on mount
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && q.trim().length > 2) {
      setAddress(q);
      doSearch(q);
    }
  }, [searchParams]);

  const doSearch = async (query: string) => {
    const q = query.trim();
    if (!q || q.length < 2) return;
    setLoading(true);
    setResult(null);
    setError('');

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dexscreener-lookup?address=${encodeURIComponent(q)}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      const json = await res.json();

      if (!json.pairs || json.pairs.length === 0) {
        setError('Token not found on DexScreener. Check the contract address and try again.');
        setLoading(false);
        return;
      }

      // Use the highest-liquidity pair
      const bestPair = json.pairs[0];
      setResult(parsePairToResult(bestPair));
    } catch (err) {
      console.error('Lookup error:', err);
      setError('Failed to fetch token data. Please try again.');
    }

    setLoading(false);
  };

  const handleSearch = () => doSearch(address);

  const copyAddress = () => {
    navigator.clipboard.writeText(result?.address || address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAge = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  return (
    <div>
      <header className="sticky top-0 z-40 glass-strong border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-primary" />
          <h1 className="text-base font-display font-bold text-foreground tracking-tight">{t('lookup.title')}</h1>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">{t('lookup.subtitle')}</p>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder={t('lookup.placeholder')}
              className="pl-9 pr-4 h-10 text-xs font-mono bg-secondary/50 border-border/50 focus:border-primary/30"
              value={address}
              onChange={e => setAddress(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || address.trim().length < 2}
            className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            {t('lookup.scan')}
          </button>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4">
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 gap-3"
            >
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
                <Eye className="w-8 h-8 text-primary" />
              </motion.div>
              <p className="text-sm text-muted-foreground">{t('lookup.scanning')}</p>
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                  />
                ))}
              </div>
            </motion.div>
          )}

          {!loading && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 gap-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-danger opacity-60" />
              </div>
              <p className="text-sm text-muted-foreground text-center max-w-[280px]">{error}</p>
            </motion.div>
          )}

          {!loading && !result && !error && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 gap-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Eye className="w-8 h-8 text-primary opacity-50" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground mb-1">{t('lookup.emptyTitle')}</p>
                <p className="text-xs text-muted-foreground max-w-[260px]">{t('lookup.emptyDesc')}</p>
              </div>
            </motion.div>
          )}

          {!loading && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              {/* Token header */}
              <div className="gradient-card rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-display font-bold text-foreground">{result.symbol}</h2>
                      <Badge variant="outline" className="text-[9px] uppercase">{result.chain}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{result.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-mono font-bold text-foreground tabular-nums">{formatPrice(result.price)}</p>
                    <div className="flex items-center gap-2 justify-end">
                      <span className={`text-xs font-mono ${result.priceChange1h >= 0 ? 'text-success' : 'text-danger'}`}>
                        {formatPct(result.priceChange1h)} 1h
                      </span>
                      <span className={`text-xs font-mono ${result.priceChange24h >= 0 ? 'text-success' : 'text-danger'}`}>
                        {formatPct(result.priceChange24h)} 24h
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                  <span>{shortenAddress(result.address)}</span>
                  <button onClick={copyAddress} className="hover:text-foreground transition-colors">
                    {copied ? <CheckCircle className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                  </button>
                  <span className="ml-auto">DEX: {result.dex}</span>
                </div>
              </div>

              {/* Chart */}
              <div className="gradient-card rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium text-foreground">{t('lookup.chart')}</span>
                  <span className="text-[9px] text-muted-foreground font-mono ml-auto">5m candles</span>
                </div>
                <MiniChart basePrice={result.price} height={160} positive={result.priceChange1h >= 0} />
              </div>

              {/* Risk Assessment */}
              <div className={`gradient-card rounded-xl p-4 ${result.riskScore >= 70 ? 'border border-danger/20' : result.riskScore >= 50 ? 'border border-warning/20' : ''}`}>
                <div className="flex items-center gap-2 mb-3">
                  {result.riskScore < 25 ? <ShieldCheck className="w-4 h-4 text-success" /> :
                   result.riskScore < 50 ? <Shield className="w-4 h-4 text-warning" /> :
                   <ShieldAlert className="w-4 h-4 text-danger" />}
                  <span className="text-sm font-display font-semibold text-foreground">{t('lookup.riskAssessment')}</span>
                </div>
                <RiskMeter score={result.riskScore} />

                {/* Risk flags */}
                {result.riskFlags.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {result.riskFlags.map((flag, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {flag.severity === 'critical' ? <XCircle className="w-3.5 h-3.5 text-danger flex-shrink-0" /> :
                         flag.severity === 'danger' ? <AlertTriangle className="w-3.5 h-3.5 text-danger flex-shrink-0" /> :
                         flag.severity === 'warning' ? <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0" /> :
                         <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0" />}
                        <span className="text-foreground/80">{flag.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Market metrics */}
              <div className="gradient-card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-display font-semibold text-foreground">{t('lookup.metrics')}</span>
                </div>
                <InfoRow label="Market Cap" value={formatNumber(result.marketCap)} icon={<TrendingUp className="w-3 h-3" />} />
                <InfoRow label="Volume 24h" value={formatNumber(result.volume24h)} icon={<BarChart3 className="w-3 h-3" />} />
                <InfoRow label="Liquidity" value={formatNumber(result.liquidity)} icon={<Droplets className="w-3 h-3" />} />
                <InfoRow label="Age" value={result.ageHours > 0 ? formatAge(result.ageHours) : 'N/A'} icon={<Clock className="w-3 h-3" />} />
                <InfoRow label="Txns 24h" value={result.txCount24h.toLocaleString()} icon={<ArrowLeftRight className="w-3 h-3" />} />
              </div>

              {/* Trading Activity */}
              <div className="gradient-card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowLeftRight className="w-4 h-4 text-primary" />
                  <span className="text-sm font-display font-semibold text-foreground">{t('lookup.activity')}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-lg bg-success/10 p-3 text-center">
                    <p className="text-[9px] text-muted-foreground mb-0.5">Buys (24h)</p>
                    <p className="text-sm font-bold font-mono text-success">{result.buyCount.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg bg-danger/10 p-3 text-center">
                    <p className="text-[9px] text-muted-foreground mb-0.5">Sells (24h)</p>
                    <p className="text-sm font-bold font-mono text-danger">{result.sellCount.toLocaleString()}</p>
                  </div>
                </div>
                {(result.buyCount + result.sellCount) > 0 && (
                  <>
                    <div className="h-2 rounded-full overflow-hidden flex">
                      <div className="bg-success h-full" style={{ width: `${(result.buyCount / (result.buyCount + result.sellCount)) * 100}%` }} />
                      <div className="bg-danger h-full flex-1" />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[9px] font-mono text-success">{((result.buyCount / (result.buyCount + result.sellCount)) * 100).toFixed(0)}% buy</span>
                      <span className="text-[9px] font-mono text-danger">{((result.sellCount / (result.buyCount + result.sellCount)) * 100).toFixed(0)}% sell</span>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
