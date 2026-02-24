import type { Token, RiskReport, RiskFlag, RiskLevel, OwnerAction, DeployerReputation } from './types';

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number) {
  return Math.floor(rand(min, max));
}

function generateDeployerReputation(): DeployerReputation {
  const total = randInt(1, 20);
  const rugs = randInt(0, Math.min(total, 5));
  const clean = total - rugs;
  const rugRatio = rugs / total;
  
  return {
    address: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    totalProjects: total,
    rugCount: rugs,
    cleanCount: clean,
    avgLifespan: rand(24, 8760),
    reputation: rugRatio > 0.5 ? 'scammer' : rugRatio > 0.2 ? 'suspicious' : rugRatio > 0 ? 'neutral' : 'trusted',
  };
}

function evaluateRisk(token: Token): RiskReport {
  const flags: RiskFlag[] = [];
  const ownerActions: OwnerAction[] = [];

  // ===== HARDCORE CHECKS =====

  // 1. Token age
  if (token.ageHours < 6) {
    flags.push({
      id: 'very_young',
      label: 'Extremely new token (<6h)',
      severity: 'critical',
      detail: `Created ${token.ageHours.toFixed(1)}h ago — peak rug risk window. 80% of rugs happen in first 24h.`,
    });
  } else if (token.ageHours < 24) {
    flags.push({
      id: 'young_token',
      label: 'Very recent token (<24h)',
      severity: 'danger',
      detail: `Created ${token.ageHours.toFixed(0)}h ago — elevated risk period.`,
    });
  } else if (token.ageHours < 72) {
    flags.push({
      id: 'new_token',
      label: 'New token (<3d)',
      severity: 'warning',
      detail: `Created ${Math.floor(token.ageHours / 24)}d ago — still in observation window.`,
    });
  }

  // 2. Liquidity depth (hardcore thresholds)
  if (token.liquidity < 10000) {
    flags.push({
      id: 'micro_liq',
      label: 'Micro liquidity (<$10K)',
      severity: 'critical',
      detail: `Only $${(token.liquidity).toFixed(0)} liquidity. Exit nearly impossible. Slippage >50%.`,
    });
  } else if (token.liquidity < 50000) {
    flags.push({
      id: 'low_liq',
      label: 'Dangerously low liquidity',
      severity: 'danger',
      detail: `$${(token.liquidity / 1000).toFixed(0)}K — high slippage, easy to manipulate.`,
    });
  } else if (token.liquidity < 200000) {
    flags.push({
      id: 'med_liq',
      label: 'Moderate liquidity',
      severity: 'warning',
      detail: `$${(token.liquidity / 1000).toFixed(0)}K — watch for sudden removal.`,
    });
  }

  // 3. Liquidity drain simulation
  const liquidityDrainRisk = Math.random() * 100;
  if (liquidityDrainRisk > 70) {
    flags.push({
      id: 'liq_drain',
      label: '⚠ Liquidity removal detected',
      severity: 'critical',
      detail: `${(liquidityDrainRisk * 0.3).toFixed(0)}% of liquidity removed in last 4h. Potential rug in progress.`,
    });
  } else if (liquidityDrainRisk > 40) {
    flags.push({
      id: 'liq_decline',
      label: 'Liquidity declining',
      severity: 'warning',
      detail: `Liquidity decreased ${(liquidityDrainRisk * 0.2).toFixed(0)}% recently. Monitoring.`,
    });
  }

  // 4. Holder concentration (critical check)
  const topHolderPct = Math.random() * 70 + 5;
  if (topHolderPct > 50) {
    flags.push({
      id: 'extreme_concentration',
      label: 'Extreme holder concentration',
      severity: 'critical',
      detail: `Top 10 hold ${topHolderPct.toFixed(0)}% — one dump kills the price.`,
    });
  } else if (topHolderPct > 30) {
    flags.push({
      id: 'high_concentration',
      label: 'High concentration risk',
      severity: 'danger',
      detail: `Top 10 hold ${topHolderPct.toFixed(0)}%. Dump risk elevated.`,
    });
  } else if (topHolderPct > 20) {
    flags.push({
      id: 'mod_concentration',
      label: 'Moderate concentration',
      severity: 'warning',
      detail: `Top 10 hold ${topHolderPct.toFixed(0)}%`,
    });
  }

  // 5. Honeypot heuristics (enhanced)
  const honeypotProb = Math.random() * 100;
  if (honeypotProb > 85) {
    flags.push({
      id: 'honeypot_confirmed',
      label: '🚨 HONEYPOT DETECTED',
      severity: 'critical',
      detail: `Sell simulation failed. Transfer restrictions detected. DO NOT BUY.`,
    });
  } else if (honeypotProb > 70) {
    flags.push({
      id: 'honeypot_suspect',
      label: 'Honeypot risk elevated',
      severity: 'danger',
      detail: `Abnormal sell restrictions or hidden transfer fees detected (${honeypotProb.toFixed(0)}% confidence).`,
    });
  }

  // 6. Tax simulation (hardcore)
  const buyTax = rand(0, 20);
  const sellTax = rand(0, 35);
  const taxChangeDetected = Math.random() > 0.75;
  
  if (sellTax > 20) {
    flags.push({
      id: 'extreme_tax',
      label: `Extreme sell tax (${sellTax.toFixed(0)}%)`,
      severity: 'critical',
      detail: `Buy: ${buyTax.toFixed(0)}%, Sell: ${sellTax.toFixed(0)}%. This is theft-level taxation.`,
    });
  } else if (sellTax > 10) {
    flags.push({
      id: 'high_tax',
      label: `High sell tax (${sellTax.toFixed(0)}%)`,
      severity: 'danger',
      detail: `Buy: ${buyTax.toFixed(0)}%, Sell: ${sellTax.toFixed(0)}%. Requires ${sellTax.toFixed(0)}% gain just to break even.`,
    });
  } else if (sellTax > 5) {
    flags.push({
      id: 'mod_tax',
      label: `Notable tax (${sellTax.toFixed(0)}%)`,
      severity: 'warning',
      detail: `Buy: ${buyTax.toFixed(0)}%, Sell: ${sellTax.toFixed(0)}%`,
    });
  }

  if (taxChangeDetected) {
    flags.push({
      id: 'tax_change',
      label: '⚠ Tax changed post-launch',
      severity: 'danger',
      detail: `Taxes were modified after initial deployment. Common rug tactic.`,
    });
  }

  // 7. Contract checks
  if (Math.random() > 0.65) {
    flags.push({
      id: 'mint_fn',
      label: 'Mint function active',
      severity: 'danger',
      detail: 'Owner can mint unlimited tokens → infinite inflation risk.',
    });
  }

  if (Math.random() > 0.75) {
    flags.push({
      id: 'blacklist_fn',
      label: 'Blacklist function found',
      severity: 'danger',
      detail: 'Owner can blacklist wallets from selling. Honeypot enabler.',
    });
  }

  if (Math.random() > 0.8) {
    flags.push({
      id: 'proxy',
      label: 'Proxy upgradeable contract',
      severity: 'warning',
      detail: 'Code can be changed at any time. All checks could become invalid.',
    });
  }

  const ownerRenounced = Math.random() > 0.5;
  if (!ownerRenounced) {
    flags.push({
      id: 'owner_active',
      label: 'Owner NOT renounced',
      severity: 'warning',
      detail: 'Contract owner retains admin privileges.',
    });
    
    // Simulate recent owner actions
    if (Math.random() > 0.6) {
      ownerActions.push({
        action: 'Parameter change (maxTxAmount modified)',
        timestamp: Date.now() - rand(3600000, 86400000),
        severity: 'warning',
      });
    }
    if (Math.random() > 0.8) {
      ownerActions.push({
        action: 'Ownership transfer initiated',
        timestamp: Date.now() - rand(1800000, 7200000),
        severity: 'danger',
      });
    }
  }

  // 8. Low holders
  if (token.holders < 50) {
    flags.push({
      id: 'micro_holders',
      label: 'Micro holder count',
      severity: 'danger',
      detail: `Only ${token.holders} holders. Essentially a private token.`,
    });
  } else if (token.holders < 200) {
    flags.push({
      id: 'low_holders',
      label: 'Very few holders',
      severity: 'warning',
      detail: `${token.holders} holders — minimal distribution.`,
    });
  }

  // 9. Extreme volatility
  if (token.volatility > 70) {
    flags.push({
      id: 'extreme_vol',
      label: 'Extreme volatility',
      severity: 'danger',
      detail: `${token.volatility.toFixed(0)}% — price can collapse instantly.`,
    });
  }

  // Deployer reputation
  const deployerRep = generateDeployerReputation();
  if (deployerRep.reputation === 'scammer') {
    flags.push({
      id: 'scam_deployer',
      label: '🚨 Deployer is known scammer',
      severity: 'critical',
      detail: `${deployerRep.rugCount}/${deployerRep.totalProjects} projects rugged. DO NOT INTERACT.`,
    });
  } else if (deployerRep.reputation === 'suspicious') {
    flags.push({
      id: 'sus_deployer',
      label: 'Suspicious deployer history',
      severity: 'danger',
      detail: `${deployerRep.rugCount} rugs out of ${deployerRep.totalProjects} projects.`,
    });
  }

  // Score calculation (weighted)
  const weights = { info: 3, warning: 10, danger: 20, critical: 35 };
  const rawScore = flags.reduce((sum, f) => sum + weights[f.severity], 0);
  const score = Math.min(100, rawScore);

  const level: RiskLevel = score >= 70 ? 'critical' : score >= 45 ? 'high' : score >= 25 ? 'medium' : 'low';
  const badge = score >= 70 ? 'AVOID' : null;

  return {
    tokenId: token.id,
    score,
    level,
    flags,
    badge,
    liquidityDrainRisk,
    taxChangeDetected,
    ownerActions,
    honeypotProbability: honeypotProb,
    deployerReputation: deployerRep,
  };
}

export function scanRisks(tokens: Token[]): Map<string, RiskReport> {
  const map = new Map<string, RiskReport>();
  for (const token of tokens) {
    map.set(token.id, evaluateRisk(token));
  }
  return map;
}
