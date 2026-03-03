import { useState, useEffect, useMemo, useRef } from 'react';
import { useCMCPrices, TRACKED_TOKENS, type CombinedApiData, type CMCTokenData, type DexTokenData } from '@/hooks/useCMCPrices';
import { evaluateSignals } from '@/lib/signalEngine';
import { scanRisks } from '@/lib/riskScanner';
import { scoreOpportunities } from '@/lib/opportunityScorer';
import { alertStore } from '@/lib/alertStore';
import { paperStore } from '@/lib/paperStore';
import { useUserPreferences } from '@/lib/userPreferences';
import type { Token, Signal, RiskReport, Alert, OpportunityScore, Chain, DEX } from '@/lib/types';

function buildTokensFromAPIs(apiData: CombinedApiData): Token[] {
  const { cmc, dex } = apiData;
  const tokens: Token[] = [];

  for (const tracked of TRACKED_TOKENS) {
    const cmcEntry = cmc[tracked.symbol];
    const dexEntry = dex[tracked.symbol];

    // Must have at least one real source
    if (!cmcEntry && !dexEntry) continue;

    // Price: CMC is primary, DexScreener is fallback
    const price = cmcEntry?.price ?? dexEntry?.priceUsd ?? 0;
    if (price === 0) continue;

    // Volume: CMC primary, DexScreener fallback
    const volume24h = cmcEntry?.volume24h ?? dexEntry?.volume24h ?? 0;

    // MarketCap: CMC primary, DexScreener fallback
    const marketCap = cmcEntry?.marketCap ?? dexEntry?.marketCap ?? 0;

    // Price changes: CMC for 1h/24h, DexScreener for 5m and more granular
    const priceChange5m = dexEntry?.priceChange5m ?? 0;
    const priceChange1h = cmcEntry?.priceChange1h ?? dexEntry?.priceChange1h ?? 0;
    const priceChange24h = cmcEntry?.priceChange24h ?? dexEntry?.priceChange24h ?? 0;

    // DexScreener-specific: volumes, txns, liquidity
    const volume5m = dexEntry?.volume5m ?? 0;
    const volume1h = dexEntry?.volume1h ?? 0;
    const liquidity = dexEntry?.liquidity ?? 0;
    const txCount24h = dexEntry?.txns24h ?? 0;
    const buyCount = dexEntry?.buys24h ?? 0;
    const sellCount = dexEntry?.sells24h ?? 0;

    // Pair age from DexScreener
    let ageHours = 0;
    if (dexEntry?.pairCreatedAt) {
      ageHours = Math.max(0, (Date.now() - dexEntry.pairCreatedAt) / 3600000);
    }

    // Token address from DexScreener
    const address = dexEntry?.baseTokenAddress ?? '';

    // Derived metrics from real data (no simulation)
    const volatility = Math.abs(priceChange24h);
    // Simple RSI approximation from price changes
    const gains = [priceChange5m, priceChange1h, priceChange24h].filter(x => x > 0);
    const losses = [priceChange5m, priceChange1h, priceChange24h].filter(x => x < 0);
    const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / gains.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length) : 0.01;
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    tokens.push({
      id: cmcEntry ? `cmc-${cmcEntry.cmcId}` : `dex-${tracked.symbol}`,
      symbol: tracked.symbol,
      name: cmcEntry?.name ?? dexEntry?.baseTokenName ?? tracked.name,
      address,
      chain: tracked.chain,
      dex: tracked.dex,
      price,
      priceChange5m,
      priceChange1h,
      priceChange24h,
      volume5m,
      volume1h,
      volume24h,
      liquidity,
      marketCap,
      txCount24h,
      buyCount,
      sellCount,
      holders: 0, // Not available from either API without premium
      ageHours,
      volatility,
      rsi,
      ema20: price, // Would need historical data for real EMA
      ema50: price,
      vwap: price,
      atr: price * (volatility / 100),
      isFavorite: false,
      tags: [],
    });
  }

  return tokens;
}

export function useMarketData() {
  const { data: apiData, isLoading, error } = useCMCPrices();
  const { prefs } = useUserPreferences();

  const [signals, setSignals] = useState<Signal[]>([]);
  const [risks, setRisks] = useState<Map<string, RiskReport>>(new Map());
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [oppScores, setOppScores] = useState<OpportunityScore[]>([]);
  // Track which alert keys we've already emitted to prevent duplicates
  const emittedAlertKeys = useRef(new Set<string>());

  const tokens = useMemo(() => {
    if (!apiData) return [];
    return buildTokensFromAPIs(apiData);
  }, [apiData]);

  // Compute signals, risks, etc when tokens change
  // Helper to emit an alert only once per unique key
  const emitAlert = (key: string, alert: Omit<Alert, 'id' | 'timestamp' | 'read'>) => {
    if (emittedAlertKeys.current.has(key)) return;
    emittedAlertKeys.current.add(key);
    alertStore.addAlert(alert);
  };

  useEffect(() => {
    if (tokens.length === 0) return;

    const sigs = evaluateSignals(tokens);
    const riskMap = scanRisks(tokens, prefs.riskProfile);

    const enrichedSignals = sigs.map(s => ({
      ...s,
      riskScore: riskMap.get(s.tokenId)?.score || 0,
    }));

    setSignals(enrichedSignals);
    setRisks(riskMap);

    const scores = scoreOpportunities(tokens, riskMap);
    setOppScores(scores);

    // Generate alerts from REAL data only (no mock smart money)
    // Signal alerts — based on real price/volume from CMC/DexScreener
    enrichedSignals.slice(0, 3).forEach(sig => {
      const key = `signal:${sig.tokenSymbol}:${sig.strategy}:${sig.type}`;
      emitAlert(key, {
        tokenId: sig.tokenId,
        tokenSymbol: sig.tokenSymbol,
        type: 'signal',
        priority: sig.confidence === 'high' ? 'high' : 'medium',
        message: `${sig.type} signal on ${sig.tokenSymbol} (${sig.strategy}, ${sig.confidence} confidence)`,
      });
    });

    // Risk alerts — based on real price/volume/liquidity analysis
    tokens.forEach(t => {
      const r = riskMap.get(t.id);
      if (r && r.score >= 70) {
        const key = `risk:${t.symbol}:${r.score}`;
        emitAlert(key, {
          tokenId: t.id,
          tokenSymbol: t.symbol,
          type: 'risk',
          priority: 'critical',
          message: `⚠ ${t.symbol} risk score ${r.score}/100 — ${r.flags.find(f => f.severity === 'critical')?.label || 'Critical risk'}`,
        });
      }
    });

    // Price movement alerts — significant real moves
    tokens.forEach(t => {
      if (Math.abs(t.priceChange1h) >= 10) {
        const direction = t.priceChange1h > 0 ? '📈' : '📉';
        const key = `price:${t.symbol}:${Math.round(t.priceChange1h)}`;
        emitAlert(key, {
          tokenId: t.id,
          tokenSymbol: t.symbol,
          type: 'price',
          priority: Math.abs(t.priceChange1h) >= 20 ? 'critical' : 'high',
          message: `${direction} ${t.symbol} ${t.priceChange1h > 0 ? '+' : ''}${t.priceChange1h.toFixed(1)}% in 1h — $${t.price.toFixed(6)}`,
        });
      }
    });

    // Volume spike alerts — real volume anomalies
    tokens.forEach(t => {
      if (t.volume1h > 0 && t.volume24h > 0) {
        const avgHourlyVol = t.volume24h / 24;
        if (avgHourlyVol > 0 && t.volume1h > avgHourlyVol * 5) {
          const multiplier = (t.volume1h / avgHourlyVol).toFixed(1);
          const key = `volume:${t.symbol}:${multiplier}`;
          emitAlert(key, {
            tokenId: t.id,
            tokenSymbol: t.symbol,
            type: 'volume',
            priority: 'high',
            message: `🔊 ${t.symbol} volume spike: ${multiplier}x average hourly volume`,
          });
        }
      }
    });
  }, [tokens, prefs.riskProfile]);

  useEffect(() => {
    const update = () => setAlerts([...alertStore.getAlerts()]);
    update();
    return alertStore.subscribe(update);
  }, []);

  useEffect(() => {
    if (tokens.length > 0) {
      paperStore.updatePrices(tokens);
    }
  }, [tokens]);

  const opportunities = useMemo(() =>
    signals.filter(s => s.type === 'ENTRY' && s.riskScore < 60),
    [signals]
  );

  const highRiskTokens = useMemo(() => {
    const result: { token: Token; risk: RiskReport }[] = [];
    tokens.forEach(t => {
      const r = risks.get(t.id);
      if (r && r.score >= 50) result.push({ token: t, risk: r });
    });
    return result.sort((a, b) => b.risk.score - a.risk.score);
  }, [tokens, risks]);

  const dailyBrief = useMemo(() => {
    const topOpps = [...oppScores]
      .filter(o => !o.capped && o.totalScore >= 40)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 5);

    const topDangers = highRiskTokens.slice(0, 5).map(({ token, risk }) => ({
      token,
      risk,
      reason: risk.flags.find(f => f.severity === 'critical')?.label || risk.flags[0]?.label || 'High risk',
    }));

    const avgChange = tokens.length > 0
      ? tokens.reduce((s, t) => s + t.priceChange24h, 0) / tokens.length
      : 0;
    const sentiment = avgChange > 5 ? 'bullish' as const : avgChange < -5 ? 'bearish' as const : 'neutral' as const;

    // Derive smart money trend from real buy/sell pressure
    const buyDominant = tokens.filter(t => t.buyCount > t.sellCount * 1.3).length;
    const sellDominant = tokens.filter(t => t.sellCount > t.buyCount * 1.3).length;

    return {
      topOpportunities: topOpps,
      topDangers,
      marketSentiment: sentiment,
      smartMoneyTrend: buyDominant > sellDominant
        ? 'Buy pressure dominant'
        : sellDominant > buyDominant
        ? 'Sell pressure dominant'
        : 'Market balanced',
      timestamp: Date.now(),
    };
  }, [oppScores, highRiskTokens, tokens]);

  const provenance = useMemo(() => ({
    source: "CMC, DexScreener",
    updatedAt: apiData ? Date.now() : null,
    status: error ? "unavailable" as const : !apiData ? "degraded" as const : "ok" as const,
  }), [apiData, error]);

  return {
    tokens,
    signals,
    risks,
    alerts,
    opportunities,
    highRiskTokens,
    oppScores,
    dailyBrief,
    unreadAlerts: alertStore.unreadCount(),
    markAlertRead: alertStore.markRead,
    markAllRead: alertStore.markAllRead,
    isLoading,
    error,
    provenance,
  };
}
