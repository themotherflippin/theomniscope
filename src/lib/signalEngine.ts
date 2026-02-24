import type { Token, Signal, SignalType, SignalStrategy, Confidence } from './types';

interface SignalRule {
  strategy: SignalStrategy;
  evaluate: (token: Token) => { triggered: boolean; type: SignalType; confidence: Confidence; reasons: string[] } | null;
}

const breakoutRule: SignalRule = {
  strategy: 'breakout',
  evaluate: (token) => {
    const reasons: string[] = [];
    let score = 0;

    if (token.price > token.ema20 && token.price > token.ema50) {
      reasons.push(`Prix au-dessus EMA20 (${token.ema20.toFixed(6)}) et EMA50 (${token.ema50.toFixed(6)})`);
      score += 2;
    }

    if (token.volume1h > token.volume24h / 24 * 3) {
      const multiplier = (token.volume1h / (token.volume24h / 24)).toFixed(1);
      reasons.push(`Volume 1h = ${multiplier}x la moyenne horaire`);
      score += 2;
    }

    if (token.priceChange1h > 5) {
      reasons.push(`Hausse de ${token.priceChange1h.toFixed(1)}% en 1h`);
      score += 1;
    }

    if (token.buyCount > token.sellCount * 1.5) {
      const ratio = (token.buyCount / token.sellCount).toFixed(1);
      reasons.push(`Buy/Sell ratio: ${ratio} — pression acheteuse`);
      score += 1;
    }

    if (score < 3) return null;

    const confidence: Confidence = score >= 5 ? 'high' : score >= 4 ? 'medium' : 'low';

    return { triggered: true, type: 'ENTRY', confidence, reasons };
  },
};

const reversalRule: SignalRule = {
  strategy: 'reversal',
  evaluate: (token) => {
    const reasons: string[] = [];
    let score = 0;

    if (token.rsi < 30) {
      reasons.push(`RSI à ${token.rsi.toFixed(0)} — zone de survente`);
      score += 2;
    } else if (token.rsi < 40) {
      reasons.push(`RSI à ${token.rsi.toFixed(0)} — approche survente`);
      score += 1;
    }

    if (token.priceChange1h > 0 && token.priceChange24h < -10) {
      reasons.push(`Rebond: +${token.priceChange1h.toFixed(1)}% 1h après -${Math.abs(token.priceChange24h).toFixed(1)}% 24h`);
      score += 2;
    }

    if (token.price < token.vwap && token.price > token.vwap * 0.97) {
      reasons.push(`Prix proche du VWAP (${token.vwap.toFixed(6)}) — support potentiel`);
      score += 1;
    }

    if (token.volume5m > token.volume1h / 12 * 2) {
      reasons.push(`Volume 5m en hausse — confirmation de l'intérêt`);
      score += 1;
    }

    if (score < 3) return null;

    const confidence: Confidence = score >= 5 ? 'high' : score >= 4 ? 'medium' : 'low';

    return { triggered: true, type: 'ENTRY', confidence, reasons };
  },
};

const trendFollowRule: SignalRule = {
  strategy: 'trend_follow',
  evaluate: (token) => {
    const reasons: string[] = [];
    let score = 0;

    // EMA cross: EMA20 > EMA50
    if (token.ema20 > token.ema50) {
      reasons.push(`EMA20 > EMA50 — tendance haussière confirmée`);
      score += 2;
    }

    // Price above VWAP
    if (token.price > token.vwap) {
      reasons.push(`Prix au-dessus du VWAP (${token.vwap.toFixed(6)})`);
      score += 1;
    }

    // Positive momentum
    if (token.priceChange1h > 2 && token.priceChange24h > 5) {
      reasons.push(`Momentum positif: +${token.priceChange1h.toFixed(1)}% 1h, +${token.priceChange24h.toFixed(1)}% 24h`);
      score += 2;
    }

    // Low volatility relative to ATR (trending, not choppy)
    if (token.volatility < 40) {
      reasons.push(`Volatilité modérée (${token.volatility.toFixed(0)}%) — trend stable`);
      score += 1;
    }

    if (score < 3) return null;

    const confidence: Confidence = score >= 5 ? 'high' : score >= 4 ? 'medium' : 'low';

    return { triggered: true, type: 'HOLD', confidence, reasons };
  },
};

const rules: SignalRule[] = [breakoutRule, reversalRule, trendFollowRule];

let signalCounter = 0;

export function evaluateSignals(tokens: Token[]): Signal[] {
  const signals: Signal[] = [];

  for (const token of tokens) {
    for (const rule of rules) {
      const result = rule.evaluate(token);
      if (result) {
        const atr = token.atr || token.price * 0.03;
        signals.push({
          id: `signal-${++signalCounter}`,
          tokenId: token.id,
          tokenSymbol: token.symbol,
          type: result.type,
          strategy: rule.strategy,
          confidence: result.confidence,
          entryZone: `$${(token.price * 0.99).toFixed(6)} – $${(token.price * 1.01).toFixed(6)}`,
          stopLoss: `$${(token.price - atr * 2).toFixed(6)}`,
          takeProfit1: `$${(token.price + atr * 2).toFixed(6)}`,
          takeProfit2: `$${(token.price + atr * 4).toFixed(6)}`,
          invalidation: `Clôture sous $${(token.price - atr * 2.5).toFixed(6)} ou RSI > 80`,
          reasons: result.reasons,
          riskScore: 0, // will be filled from risk scanner
          timestamp: Date.now(),
        });
      }
    }
  }

  // Also generate EXIT/AVOID signals
  for (const token of tokens) {
    if (token.rsi > 80 && token.priceChange1h < -3) {
      signals.push({
        id: `signal-${++signalCounter}`,
        tokenId: token.id,
        tokenSymbol: token.symbol,
        type: 'EXIT',
        strategy: 'breakout',
        confidence: 'high',
        entryZone: '—',
        stopLoss: '—',
        takeProfit1: '—',
        takeProfit2: '—',
        invalidation: 'RSI retour sous 70 avec volume croissant',
        reasons: [
          `RSI à ${token.rsi.toFixed(0)} — zone de surachat`,
          `Baisse de ${Math.abs(token.priceChange1h).toFixed(1)}% en 1h — début de correction`,
          `Sell pressure: ratio buy/sell = ${(token.buyCount / token.sellCount).toFixed(2)}`,
        ],
        riskScore: 0,
        timestamp: Date.now(),
      });
    }
  }

  return signals;
}
