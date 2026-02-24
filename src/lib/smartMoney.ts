import type { Token, SmartWallet, WalletActivity, SmartMoneySignal, WhosBuying } from './types';

// Mock smart wallets database
const MOCK_WALLETS: SmartWallet[] = [
  { address: '0x7a16ff8270133f063aab6c9977183d9e72835428', label: 'whale_alpha', type: 'whale', winRate: 72, totalTrades: 341, pnl: 2400000, lastActive: Date.now() - 3600000, tags: ['early_mover', 'high_volume'] },
  { address: '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be', label: 'degen_king', type: 'smart_trader', winRate: 68, totalTrades: 892, pnl: 890000, lastActive: Date.now() - 7200000, tags: ['meme_hunter', 'fast_exit'] },
  { address: '0x28c6c06298d514db089934071355e5743bf21d60', label: 'fund_0x28', type: 'fund', winRate: 61, totalTrades: 156, pnl: 5200000, lastActive: Date.now() - 1800000, tags: ['institutional', 'conservative'] },
  { address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', label: 'smart_sniper', type: 'smart_trader', winRate: 78, totalTrades: 203, pnl: 1100000, lastActive: Date.now() - 900000, tags: ['sniping', 'early_entry'] },
  { address: '0x5a52e96bacdabb82fd05763e25335261b270efcb', label: 'insider_suspect', type: 'insider', winRate: 85, totalTrades: 47, pnl: 620000, lastActive: Date.now() - 14400000, tags: ['high_winrate', 'suspicious'] },
  { address: '0xab5801a7d398351b8be11c439e05c5b3259aec9b', label: 'whale_beta', type: 'whale', winRate: 55, totalTrades: 678, pnl: 3800000, lastActive: Date.now() - 600000, tags: ['swing_trader', 'large_positions'] },
  { address: '0x1db3439a222c519ab44bb1144fc28167b4fa6ee6', label: 'arb_bot', type: 'smart_trader', winRate: 91, totalTrades: 12400, pnl: 450000, lastActive: Date.now() - 120000, tags: ['arbitrage', 'high_frequency'] },
  { address: '0x0d0707963952f2fba59dd06f2b425ace40b492fe', label: 'deployer_clean', type: 'deployer', winRate: 60, totalTrades: 28, pnl: 180000, lastActive: Date.now() - 86400000, tags: ['deployer', 'clean_history'] },
];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function generateWalletActivities(tokens: Token[]): WalletActivity[] {
  const activities: WalletActivity[] = [];
  
  for (const token of tokens) {
    // Random number of wallet activities per token
    const activityCount = Math.floor(rand(0, 5));
    const wallets = pickRandom(MOCK_WALLETS, activityCount);
    
    for (const wallet of wallets) {
      const isBuy = Math.random() > 0.35; // slight buy bias
      activities.push({
        wallet,
        tokenId: token.id,
        action: isBuy ? 'buy' : 'sell',
        amount: rand(500, 200000),
        timestamp: Date.now() - rand(0, 86400000),
        isAccumulation: isBuy && wallet.winRate > 65 && Math.random() > 0.5,
      });
    }
  }

  return activities.sort((a, b) => b.timestamp - a.timestamp);
}

export function generateSmartMoneySignals(tokens: Token[], activities: WalletActivity[]): SmartMoneySignal[] {
  const signals: SmartMoneySignal[] = [];
  let counter = 0;

  // Group activities by token
  const byToken = new Map<string, WalletActivity[]>();
  for (const a of activities) {
    const arr = byToken.get(a.tokenId) || [];
    arr.push(a);
    byToken.set(a.tokenId, arr);
  }

  for (const [tokenId, acts] of byToken) {
    const token = tokens.find(t => t.id === tokenId);
    if (!token) continue;

    const buys = acts.filter(a => a.action === 'buy');
    const sells = acts.filter(a => a.action === 'sell');
    const uniqueBuyers = new Set(buys.map(b => b.wallet.address)).size;
    const totalBuyVol = buys.reduce((s, b) => s + b.amount, 0);
    const totalSellVol = sells.reduce((s, b) => s + b.amount, 0);

    // Accumulation signal: multiple smart wallets buying, little selling
    if (uniqueBuyers >= 2 && totalBuyVol > totalSellVol * 2) {
      signals.push({
        id: `sm-${++counter}`,
        tokenId,
        tokenSymbol: token.symbol,
        type: 'accumulation',
        walletCount: uniqueBuyers,
        totalVolume: totalBuyVol,
        confidence: uniqueBuyers >= 3 ? 'high' : 'medium',
        detail: `${uniqueBuyers} smart wallets accumulating $${(totalBuyVol / 1000).toFixed(0)}K with minimal sell pressure`,
        timestamp: Date.now() - rand(0, 3600000),
      });
    }

    // Distribution signal: heavy selling
    if (totalSellVol > totalBuyVol * 3 && sells.length >= 2) {
      signals.push({
        id: `sm-${++counter}`,
        tokenId,
        tokenSymbol: token.symbol,
        type: 'distribution',
        walletCount: new Set(sells.map(s => s.wallet.address)).size,
        totalVolume: totalSellVol,
        confidence: 'high',
        detail: `Smart money exiting — $${(totalSellVol / 1000).toFixed(0)}K sold`,
        timestamp: Date.now() - rand(0, 1800000),
      });
    }

    // New position: single high-conviction wallet entering
    const highConvBuys = buys.filter(b => b.wallet.winRate > 70 && b.amount > 10000);
    if (highConvBuys.length > 0 && buys.length <= 2) {
      const w = highConvBuys[0].wallet;
      signals.push({
        id: `sm-${++counter}`,
        tokenId,
        tokenSymbol: token.symbol,
        type: 'new_position',
        walletCount: 1,
        totalVolume: highConvBuys[0].amount,
        confidence: w.winRate > 75 ? 'high' : 'medium',
        detail: `${w.label} (${w.winRate}% WR) opened $${(highConvBuys[0].amount / 1000).toFixed(0)}K position`,
        timestamp: highConvBuys[0].timestamp,
      });
    }
  }

  return signals.sort((a, b) => b.timestamp - a.timestamp);
}

export function getWhosBuying(tokenId: string, activities: WalletActivity[]): WhosBuying {
  const tokenActs = activities.filter(a => a.tokenId === tokenId);
  
  // Net buy per wallet
  const netByWallet = new Map<string, { wallet: SmartWallet; netBuy: number }>();
  for (const act of tokenActs) {
    const key = act.wallet.address;
    const existing = netByWallet.get(key) || { wallet: act.wallet, netBuy: 0 };
    existing.netBuy += act.action === 'buy' ? act.amount : -act.amount;
    netByWallet.set(key, existing);
  }

  const entries = [...netByWallet.values()];
  const topBuyers = entries.filter(e => e.netBuy > 0).sort((a, b) => b.netBuy - a.netBuy).slice(0, 5);
  const winnerWallets = entries.filter(e => e.wallet.pnl > 0).length;
  const newWallets = Math.floor(rand(0, 15));
  const totalSmartMoneyFlow = entries.reduce((s, e) => s + e.netBuy, 0);

  return { topBuyers, newWallets, winnerWallets, totalSmartMoneyFlow };
}

export function getSmartWallets(): SmartWallet[] {
  return MOCK_WALLETS;
}
