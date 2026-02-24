import { useState, useEffect, useMemo } from 'react';
import { generateMockTokens } from '@/lib/mockData';
import { evaluateSignals } from '@/lib/signalEngine';
import { scanRisks } from '@/lib/riskScanner';
import { scoreOpportunities } from '@/lib/opportunityScorer';
import { generateWalletActivities, generateSmartMoneySignals, getWhosBuying } from '@/lib/smartMoney';
import { alertStore } from '@/lib/alertStore';
import { paperStore } from '@/lib/paperStore';
import type { Token, Signal, RiskReport, Alert, OpportunityScore, WalletActivity, SmartMoneySignal } from '@/lib/types';

export function useMarketData() {
  const [tokens, setTokens] = useState<Token[]>(() => generateMockTokens());
  const [signals, setSignals] = useState<Signal[]>([]);
  const [risks, setRisks] = useState<Map<string, RiskReport>>(new Map());
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [oppScores, setOppScores] = useState<OpportunityScore[]>([]);
  const [walletActivities, setWalletActivities] = useState<WalletActivity[]>([]);
  const [smartMoneySignals, setSmartMoneySignals] = useState<SmartMoneySignal[]>([]);

  // Initial compute
  useEffect(() => {
    const sigs = evaluateSignals(tokens);
    const riskMap = scanRisks(tokens);
    
    const enrichedSignals = sigs.map(s => ({
      ...s,
      riskScore: riskMap.get(s.tokenId)?.score || 0,
    }));
    
    setSignals(enrichedSignals);
    setRisks(riskMap);

    // Opportunity scoring
    const scores = scoreOpportunities(tokens, riskMap);
    setOppScores(scores);

    // Smart money
    const activities = generateWalletActivities(tokens);
    setWalletActivities(activities);
    const smSignals = generateSmartMoneySignals(tokens, activities);
    setSmartMoneySignals(smSignals);

    // Generate alerts
    enrichedSignals.slice(0, 3).forEach(sig => {
      alertStore.addAlert({
        tokenId: sig.tokenId,
        tokenSymbol: sig.tokenSymbol,
        type: 'signal',
        priority: sig.confidence === 'high' ? 'high' : 'medium',
        message: `${sig.type} signal on ${sig.tokenSymbol} (${sig.strategy}, ${sig.confidence} confidence)`,
      });
    });

    // Smart money alerts
    smSignals.filter(s => s.confidence === 'high').slice(0, 2).forEach(s => {
      alertStore.addAlert({
        tokenId: s.tokenId,
        tokenSymbol: s.tokenSymbol,
        type: 'smart_money',
        priority: 'high',
        message: `Smart money ${s.type}: ${s.detail}`,
      });
    });

    // Risk alerts for critical tokens
    tokens.forEach(t => {
      const r = riskMap.get(t.id);
      if (r && r.score >= 70) {
        alertStore.addAlert({
          tokenId: t.id,
          tokenSymbol: t.symbol,
          type: 'risk',
          priority: 'critical',
          message: `⚠ ${t.symbol} risk score ${r.score}/100 — ${r.flags.find(f => f.severity === 'critical')?.label || 'Critical risk'}`,
        });
      }
    });
  }, []);

  // Subscribe to alert store
  useEffect(() => {
    const update = () => setAlerts([...alertStore.getAlerts()]);
    update();
    return alertStore.subscribe(update);
  }, []);

  // Simulate live price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTokens(prev => prev.map(t => {
        const change = t.price * (Math.random() - 0.48) * 0.005;
        const newPrice = Math.max(0.000001, t.price + change);
        return {
          ...t,
          price: newPrice,
          priceChange5m: t.priceChange5m + (Math.random() - 0.5) * 0.5,
        };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Update paper trades with prices
  useEffect(() => {
    paperStore.updatePrices(tokens);
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

  // Daily brief
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

    const avgChange = tokens.reduce((s, t) => s + t.priceChange24h, 0) / tokens.length;
    const sentiment = avgChange > 5 ? 'bullish' as const : avgChange < -5 ? 'bearish' as const : 'neutral' as const;

    return {
      topOpportunities: topOpps,
      topDangers,
      marketSentiment: sentiment,
      smartMoneyTrend: smartMoneySignals.filter(s => s.type === 'accumulation').length > smartMoneySignals.filter(s => s.type === 'distribution').length
        ? 'Smart money accumulating'
        : 'Smart money cautious',
      timestamp: Date.now(),
    };
  }, [oppScores, highRiskTokens, tokens, smartMoneySignals]);

  return {
    tokens,
    signals,
    risks,
    alerts,
    opportunities,
    highRiskTokens,
    oppScores,
    walletActivities,
    smartMoneySignals,
    dailyBrief,
    unreadAlerts: alertStore.unreadCount(),
    markAlertRead: alertStore.markRead,
    markAllRead: alertStore.markAllRead,
    getWhosBuying: (tokenId: string) => getWhosBuying(tokenId, walletActivities),
  };
}
