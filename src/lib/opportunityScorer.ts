import type { Token, RiskReport, OpportunityScore, OpportunityFactor } from './types';

/**
 * OMNISCOPE Opportunity Scoring Engine
 * 
 * Multi-factor scoring (0-100) combining:
 * 1. Momentum (0-20): price structure, trend alignment
 * 2. Flow Quality (0-20): tx velocity, buy/sell pressure
 * 3. Liquidity Health (0-20): depth, stability, slippage
 * 4. Risk Inverse (0-20): smart contract safety (inverted risk)
 * 5. Market Context (0-20): chain sentiment, volume anomaly
 * 
 * CRITICAL: If any critical risk flag → score CAPPED at 25 max → AVOID
 */

let scoreCounter = 0;

function scoreMomentum(token: Token): OpportunityFactor[] {
  const factors: OpportunityFactor[] = [];
  let score = 0;
  let detail = '';

  // EMA alignment: price > EMA20 > EMA50 = strong trend
  if (token.price > token.ema20 && token.ema20 > token.ema50) {
    score += 8;
    detail = `Strong uptrend: Price > EMA20 > EMA50`;
  } else if (token.price > token.ema20) {
    score += 4;
    detail = `Above EMA20, trend developing`;
  } else if (token.price > token.ema50) {
    score += 2;
    detail = `Above EMA50 but below EMA20 — caution`;
  } else {
    detail = `Below both EMAs — no bullish structure`;
  }

  // RSI sweet spot (40-65 = healthy momentum, not overbought)
  if (token.rsi >= 40 && token.rsi <= 65) {
    score += 5;
    detail += ` | RSI ${token.rsi.toFixed(0)} in sweet spot`;
  } else if (token.rsi < 30) {
    score += 3; // oversold bounce potential
    detail += ` | RSI ${token.rsi.toFixed(0)} oversold — reversal play`;
  } else if (token.rsi > 70) {
    score -= 2;
    detail += ` | RSI ${token.rsi.toFixed(0)} overbought ⚠`;
  }

  // Price action momentum
  if (token.priceChange1h > 3 && token.priceChange1h < 20) {
    score += 4;
    detail += ` | +${token.priceChange1h.toFixed(1)}% 1h healthy`;
  } else if (token.priceChange1h > 20) {
    score += 1; // too much too fast
    detail += ` | +${token.priceChange1h.toFixed(1)}% 1h — overextended`;
  }

  // VWAP support
  if (token.price > token.vwap && token.price < token.vwap * 1.05) {
    score += 3;
    detail += ` | Near VWAP support`;
  }

  factors.push({
    name: 'Momentum',
    category: 'momentum',
    score: Math.max(0, Math.min(20, score)),
    weight: 1,
    detail,
  });

  return factors;
}

function scoreFlowQuality(token: Token): OpportunityFactor[] {
  let score = 0;
  let detail = '';

  // Buy/sell pressure
  const buySellRatio = token.buyCount / Math.max(1, token.sellCount);
  if (buySellRatio > 2) {
    score += 7;
    detail = `Strong buy pressure: ${buySellRatio.toFixed(1)}x ratio`;
  } else if (buySellRatio > 1.3) {
    score += 4;
    detail = `Moderate buy pressure: ${buySellRatio.toFixed(1)}x`;
  } else if (buySellRatio < 0.7) {
    detail = `Sell dominant: ${buySellRatio.toFixed(1)}x — distribution`;
  } else {
    score += 1;
    detail = `Balanced flow: ${buySellRatio.toFixed(1)}x`;
  }

  // Volume spike (5m vs hourly avg)
  const avgHourlyVol = token.volume1h / 1;
  const vol5mNormalized = token.volume5m * 12; // annualize to hourly
  if (vol5mNormalized > avgHourlyVol * 3) {
    score += 6;
    detail += ` | Volume spike ${(vol5mNormalized / avgHourlyVol).toFixed(1)}x`;
  } else if (vol5mNormalized > avgHourlyVol * 1.5) {
    score += 3;
    detail += ` | Volume above avg`;
  }

  // Tx velocity
  const txPerHour = token.txCount24h / 24;
  if (txPerHour > 100) {
    score += 4;
    detail += ` | High tx velocity (${txPerHour.toFixed(0)}/h)`;
  } else if (txPerHour > 30) {
    score += 2;
    detail += ` | Moderate activity`;
  }

  // Volume/mcap ratio (healthy > 5%)
  const volMcapRatio = (token.volume24h / Math.max(1, token.marketCap)) * 100;
  if (volMcapRatio > 10) {
    score += 3;
    detail += ` | Vol/MCap ${volMcapRatio.toFixed(1)}% — high interest`;
  }

  return [{
    name: 'Flow Quality',
    category: 'flow',
    score: Math.max(0, Math.min(20, score)),
    weight: 1,
    detail,
  }];
}

function scoreLiquidityHealth(token: Token): OpportunityFactor[] {
  let score = 0;
  let detail = '';

  // Absolute liquidity
  if (token.liquidity > 5000000) {
    score += 8;
    detail = `Deep liquidity: $${(token.liquidity / 1e6).toFixed(1)}M`;
  } else if (token.liquidity > 1000000) {
    score += 6;
    detail = `Good liquidity: $${(token.liquidity / 1e6).toFixed(1)}M`;
  } else if (token.liquidity > 200000) {
    score += 3;
    detail = `Moderate liquidity: $${(token.liquidity / 1e3).toFixed(0)}K`;
  } else {
    detail = `Low liquidity: $${(token.liquidity / 1e3).toFixed(0)}K ⚠`;
  }

  // Liquidity/mcap ratio (healthy > 10%)
  const liqMcapRatio = (token.liquidity / Math.max(1, token.marketCap)) * 100;
  if (liqMcapRatio > 20) {
    score += 5;
    detail += ` | Liq/MCap ${liqMcapRatio.toFixed(0)}% — well backed`;
  } else if (liqMcapRatio > 8) {
    score += 3;
    detail += ` | Liq/MCap ${liqMcapRatio.toFixed(0)}%`;
  } else {
    detail += ` | Liq/MCap ${liqMcapRatio.toFixed(0)}% — undercollateralized`;
  }

  // Volatility as proxy for stability
  if (token.volatility < 25) {
    score += 5;
    detail += ` | Low vol (${token.volatility.toFixed(0)}%) — stable`;
  } else if (token.volatility < 45) {
    score += 3;
    detail += ` | Moderate vol`;
  } else {
    detail += ` | High vol (${token.volatility.toFixed(0)}%) — choppy`;
  }

  // Slippage estimate (based on liquidity depth)
  const estSlippage = estimateSlippage(token.liquidity, 1000);
  if (estSlippage < 0.5) {
    score += 2;
    detail += ` | Est. slippage <0.5%`;
  }

  return [{
    name: 'Liquidity Health',
    category: 'liquidity',
    score: Math.max(0, Math.min(20, score)),
    weight: 1,
    detail,
  }];
}

function scoreRiskInverse(riskReport: RiskReport): OpportunityFactor[] {
  // Invert risk: low risk = high opportunity score
  const invertedScore = Math.max(0, 20 - (riskReport.score / 5));
  const criticalFlags = riskReport.flags.filter(f => f.severity === 'critical').length;
  const dangerFlags = riskReport.flags.filter(f => f.severity === 'danger').length;

  let detail = `Risk score ${riskReport.score}/100`;
  if (criticalFlags > 0) {
    detail += ` | ${criticalFlags} CRITICAL flag(s) ⛔`;
  }
  if (dangerFlags > 0) {
    detail += ` | ${dangerFlags} danger flag(s)`;
  }
  if (riskReport.score < 25) {
    detail += ` | Clean contract ✓`;
  }

  return [{
    name: 'Contract Safety',
    category: 'risk',
    score: Math.max(0, Math.min(20, invertedScore)),
    weight: 1,
    detail,
  }];
}

function scoreMarketContext(token: Token): OpportunityFactor[] {
  let score = 10; // baseline neutral
  let detail = '';

  // Token age bonus (established > 7 days)
  if (token.ageHours > 168) {
    score += 3;
    detail = `Established (${Math.floor(token.ageHours / 24)}d)`;
  } else if (token.ageHours > 48) {
    score += 1;
    detail = `Young (${Math.floor(token.ageHours / 24)}d)`;
  } else {
    score -= 3;
    detail = `Very new (${token.ageHours.toFixed(0)}h) — high uncertainty`;
  }

  // Holder distribution
  if (token.holders > 5000) {
    score += 4;
    detail += ` | ${token.holders.toLocaleString()} holders — distributed`;
  } else if (token.holders > 1000) {
    score += 2;
    detail += ` | ${token.holders.toLocaleString()} holders`;
  } else {
    score -= 2;
    detail += ` | Only ${token.holders} holders — concentrated`;
  }

  // Chain bonus (established chains)
  if (['ethereum', 'arbitrum'].includes(token.chain)) {
    score += 2;
    detail += ` | ${token.chain} — established chain`;
  }

  return [{
    name: 'Market Context',
    category: 'context',
    score: Math.max(0, Math.min(20, score)),
    weight: 1,
    detail,
  }];
}

export function estimateSlippage(liquidity: number, orderSize: number): number {
  // Simplified constant product AMM slippage estimation
  // slippage ≈ orderSize / (2 * liquidity) * 100
  if (liquidity <= 0) return 99;
  return (orderSize / (2 * liquidity)) * 100;
}

export function estimatePriceImpact(liquidity: number, orderSize: number): number {
  // Price impact for constant product AMM
  // Δp/p ≈ orderSize / liquidity
  if (liquidity <= 0) return 100;
  return (orderSize / liquidity) * 100;
}

function determineGrade(score: number): OpportunityScore['grade'] {
  if (score >= 80) return 'S';
  if (score >= 65) return 'A';
  if (score >= 50) return 'B';
  if (score >= 35) return 'C';
  if (score >= 20) return 'D';
  return 'F';
}

function determineAction(score: number, capped: boolean): OpportunityScore['action'] {
  if (capped) return 'AVOID';
  if (score >= 70) return 'STRONG_BUY';
  if (score >= 50) return 'BUY';
  if (score >= 30) return 'WATCH';
  return 'AVOID';
}

export function scoreOpportunities(
  tokens: Token[],
  risks: Map<string, RiskReport>
): OpportunityScore[] {
  return tokens.map(token => {
    const risk = risks.get(token.id);
    if (!risk) return null;

    const allFactors: OpportunityFactor[] = [
      ...scoreMomentum(token),
      ...scoreFlowQuality(token),
      ...scoreLiquidityHealth(token),
      ...scoreRiskInverse(risk),
      ...scoreMarketContext(token),
    ];

    let totalScore = allFactors.reduce((sum, f) => sum + f.score, 0);

    // CRITICAL CAP: if risk has critical flags → cap at 25
    const hasCritical = risk.flags.some(f => f.severity === 'critical');
    let capped = false;
    let cappedReason: string | null = null;
    if (hasCritical) {
      totalScore = Math.min(25, totalScore);
      capped = true;
      cappedReason = risk.flags.find(f => f.severity === 'critical')?.label || 'Critical risk flag detected';
    }

    // Also cap if risk score > 70
    if (risk.score >= 70 && !capped) {
      totalScore = Math.min(30, totalScore);
      capped = true;
      cappedReason = `Risk score ${risk.score}/100 — too dangerous`;
    }

    // Top 5 reasons: pick best factors + any caps
    const topReasons: string[] = [];
    const sortedFactors = [...allFactors].sort((a, b) => b.score - a.score);
    for (const f of sortedFactors.slice(0, 4)) {
      topReasons.push(`${f.name}: ${f.detail}`);
    }
    if (capped && cappedReason) {
      topReasons.unshift(`⛔ CAPPED: ${cappedReason}`);
    }

    // Trade plan
    const atr = token.atr || token.price * 0.03;
    const slippage = estimateSlippage(token.liquidity, 1000);
    const impact = estimatePriceImpact(token.liquidity, 1000);

    return {
      tokenId: token.id,
      tokenSymbol: token.symbol,
      totalScore,
      capped,
      cappedReason,
      factors: allFactors,
      topReasons: topReasons.slice(0, 5),
      grade: determineGrade(totalScore),
      action: determineAction(totalScore, capped),
      entryZone: `$${(token.price * 0.99).toFixed(6)} – $${(token.price * 1.01).toFixed(6)}`,
      stopLoss: `$${(token.price - atr * 2).toFixed(6)}`,
      takeProfit1: `$${(token.price + atr * 2).toFixed(6)}`,
      takeProfit2: `$${(token.price + atr * 4).toFixed(6)}`,
      riskRewardRatio: 2,
      invalidation: `Close below $${(token.price - atr * 2.5).toFixed(6)}`,
      estimatedSlippage: slippage,
      priceImpact: impact,
      timestamp: Date.now(),
    };
  }).filter(Boolean) as OpportunityScore[];
}
