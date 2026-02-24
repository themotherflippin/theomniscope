import { useState, useEffect, useMemo } from 'react';
import { generateMockTokens } from '@/lib/mockData';
import { evaluateSignals } from '@/lib/signalEngine';
import { scanRisks } from '@/lib/riskScanner';
import { alertStore } from '@/lib/alertStore';
import type { Token, Signal, RiskReport, Alert } from '@/lib/types';

export function useMarketData() {
  const [tokens, setTokens] = useState<Token[]>(() => generateMockTokens());
  const [signals, setSignals] = useState<Signal[]>([]);
  const [risks, setRisks] = useState<Map<string, RiskReport>>(new Map());
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Initial compute
  useEffect(() => {
    const sigs = evaluateSignals(tokens);
    const riskMap = scanRisks(tokens);
    
    // Attach risk scores to signals
    const enrichedSignals = sigs.map(s => ({
      ...s,
      riskScore: riskMap.get(s.tokenId)?.score || 0,
    }));
    
    setSignals(enrichedSignals);
    setRisks(riskMap);

    // Generate initial alerts from signals
    enrichedSignals.slice(0, 5).forEach(sig => {
      alertStore.addAlert({
        tokenId: sig.tokenId,
        tokenSymbol: sig.tokenSymbol,
        type: 'signal',
        message: `${sig.type} signal on ${sig.tokenSymbol} (${sig.strategy}, ${sig.confidence} confidence)`,
      });
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

  return {
    tokens,
    signals,
    risks,
    alerts,
    opportunities,
    highRiskTokens,
    unreadAlerts: alertStore.unreadCount(),
    markAlertRead: alertStore.markRead,
    markAllRead: alertStore.markAllRead,
  };
}
