import type { Token, RiskReport, RiskFlag, RiskLevel } from './types';

function evaluateRisk(token: Token): RiskReport {
  const flags: RiskFlag[] = [];

  // Age check
  if (token.ageHours < 24) {
    flags.push({
      id: 'young_token',
      label: 'Token très récent',
      severity: 'warning',
      detail: `Créé il y a ${token.ageHours.toFixed(0)}h — risque accru de rug pull`,
    });
  }

  // Low liquidity
  if (token.liquidity < 50000) {
    flags.push({
      id: 'low_liq',
      label: 'Liquidité faible',
      severity: 'danger',
      detail: `Liquidity: $${(token.liquidity / 1000).toFixed(0)}K — slippage élevé, exit difficile`,
    });
  } else if (token.liquidity < 200000) {
    flags.push({
      id: 'med_liq',
      label: 'Liquidité modérée',
      severity: 'warning',
      detail: `Liquidity: $${(token.liquidity / 1000).toFixed(0)}K — surveiller`,
    });
  }

  // High concentration (simulated)
  const topHolderPct = Math.random() * 60 + 5;
  if (topHolderPct > 40) {
    flags.push({
      id: 'concentration',
      label: 'Concentration élevée',
      severity: 'critical',
      detail: `Top 10 holders détiennent ${topHolderPct.toFixed(0)}% — risque de dump`,
    });
  } else if (topHolderPct > 25) {
    flags.push({
      id: 'concentration',
      label: 'Concentration modérée',
      severity: 'warning',
      detail: `Top 10 holders détiennent ${topHolderPct.toFixed(0)}%`,
    });
  }

  // Simulated contract checks
  if (Math.random() > 0.7) {
    flags.push({
      id: 'mint_fn',
      label: 'Fonction mint active',
      severity: 'danger',
      detail: 'Le contrat contient une fonction mint — inflation possible',
    });
  }

  if (Math.random() > 0.8) {
    flags.push({
      id: 'proxy',
      label: 'Contrat upgradeable',
      severity: 'warning',
      detail: 'Proxy pattern détecté — le code peut être modifié',
    });
  }

  if (Math.random() > 0.85) {
    flags.push({
      id: 'honeypot',
      label: 'Risque honeypot',
      severity: 'critical',
      detail: 'Heuristique: taxes sell >20% ou blacklist function détectée',
    });
  }

  // Buy/sell tax simulation
  const buyTax = Math.random() * 15;
  const sellTax = Math.random() * 25;
  if (sellTax > 10) {
    flags.push({
      id: 'high_tax',
      label: `Tax sell élevée (${sellTax.toFixed(0)}%)`,
      severity: sellTax > 15 ? 'critical' : 'danger',
      detail: `Buy tax: ${buyTax.toFixed(0)}%, Sell tax: ${sellTax.toFixed(0)}%`,
    });
  }

  // Low holders
  if (token.holders < 100) {
    flags.push({
      id: 'low_holders',
      label: 'Peu de holders',
      severity: 'warning',
      detail: `Seulement ${token.holders} holders — distribution très faible`,
    });
  }

  // High volatility
  if (token.volatility > 60) {
    flags.push({
      id: 'high_vol',
      label: 'Volatilité extrême',
      severity: 'warning',
      detail: `Volatilité de ${token.volatility.toFixed(0)}% — mouvements imprévisibles`,
    });
  }

  // Score: sum of severity weights
  const weights = { info: 5, warning: 12, danger: 22, critical: 35 };
  const rawScore = flags.reduce((sum, f) => sum + weights[f.severity], 0);
  const score = Math.min(100, rawScore);

  const level: RiskLevel = score >= 70 ? 'critical' : score >= 45 ? 'high' : score >= 25 ? 'medium' : 'low';
  const badge = score >= 70 ? 'AVOID' : null;

  return { tokenId: token.id, score, level, flags, badge };
}

export function scanRisks(tokens: Token[]): Map<string, RiskReport> {
  const map = new Map<string, RiskReport>();
  for (const token of tokens) {
    map.set(token.id, evaluateRisk(token));
  }
  return map;
}
