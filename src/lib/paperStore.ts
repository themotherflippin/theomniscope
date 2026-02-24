import type { PaperTrade, PaperPortfolio, Token } from './types';

let tradeCounter = 0;

function createStore() {
  let trades: PaperTrade[] = [];
  let ignoredTokens: Set<string> = new Set();
  let trackedTokens: Set<string> = new Set();
  let listeners: (() => void)[] = [];

  // Load from localStorage
  try {
    const stored = localStorage.getItem('oracle_paper');
    if (stored) {
      const data = JSON.parse(stored);
      trades = data.trades || [];
      ignoredTokens = new Set(data.ignoredTokens || []);
      trackedTokens = new Set(data.trackedTokens || []);
    }
  } catch {}

  function save() {
    localStorage.setItem('oracle_paper', JSON.stringify({
      trades,
      ignoredTokens: [...ignoredTokens],
      trackedTokens: [...trackedTokens],
    }));
  }

  function notify() {
    save();
    listeners.forEach(fn => fn());
  }

  return {
    // Paper trading
    openTrade: (token: Token, positionSize: number, stopLoss: number, tp1: number, tp2: number, slippage: number): PaperTrade => {
      const trade: PaperTrade = {
        id: `paper-${++tradeCounter}`,
        tokenId: token.id,
        tokenSymbol: token.symbol,
        entryPrice: token.price * (1 + slippage / 100), // account for slippage
        currentPrice: token.price,
        stopLoss,
        takeProfit1: tp1,
        takeProfit2: tp2,
        positionSize,
        entrySlippage: slippage,
        status: 'open',
        pnl: 0,
        pnlPercent: 0,
        openedAt: Date.now(),
      };
      trades = [trade, ...trades];
      notify();
      return trade;
    },

    closeTrade: (id: string, reason: PaperTrade['status']) => {
      trades = trades.map(t => 
        t.id === id ? { ...t, status: reason, closedAt: Date.now() } : t
      );
      notify();
    },

    updatePrices: (tokens: Token[]) => {
      let changed = false;
      trades = trades.map(t => {
        if (t.status !== 'open') return t;
        const token = tokens.find(tok => tok.id === t.tokenId);
        if (!token) return t;
        
        const pnl = (token.price - t.entryPrice) * (t.positionSize / t.entryPrice);
        const pnlPercent = ((token.price - t.entryPrice) / t.entryPrice) * 100;
        
        // Auto-close on SL/TP
        let status: PaperTrade['status'] = t.status;
        if (token.price <= t.stopLoss) status = 'closed_sl';
        else if (token.price >= t.takeProfit2) status = 'closed_tp2';
        else if (token.price >= t.takeProfit1 && t.status === 'open') status = 'closed_tp1';

        if (status !== t.status || Math.abs(pnl - t.pnl) > 0.01) changed = true;
        
        return {
          ...t,
          currentPrice: token.price,
          pnl,
          pnlPercent,
          status,
          closedAt: status !== 'open' ? Date.now() : undefined,
        };
      });
      if (changed) notify();
    },

    getTrades: (): PaperTrade[] => trades,
    
    getPortfolio: (): PaperPortfolio => {
      const closedTrades = trades.filter(t => t.status !== 'open');
      const wins = closedTrades.filter(t => t.pnl > 0);
      const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
      const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;
      
      // Max drawdown
      let peak = 0, maxDD = 0, running = 0;
      for (const t of closedTrades) {
        running += t.pnl;
        if (running > peak) peak = running;
        const dd = peak - running;
        if (dd > maxDD) maxDD = dd;
      }

      const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
      const losses = closedTrades.filter(t => t.pnl <= 0);
      const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 1;
      const expectancy = (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss;

      return { trades, totalPnl, winRate, maxDrawdown: maxDD, expectancy, totalTrades: trades.length };
    },

    // Token actions
    ignoreToken: (tokenId: string) => { ignoredTokens.add(tokenId); notify(); },
    unignoreToken: (tokenId: string) => { ignoredTokens.delete(tokenId); notify(); },
    isIgnored: (tokenId: string) => ignoredTokens.has(tokenId),
    
    trackToken: (tokenId: string) => { trackedTokens.add(tokenId); notify(); },
    untrackToken: (tokenId: string) => { trackedTokens.delete(tokenId); notify(); },
    isTracked: (tokenId: string) => trackedTokens.has(tokenId),

    getIgnoredTokens: () => ignoredTokens,
    getTrackedTokens: () => trackedTokens,

    subscribe: (fn: () => void) => {
      listeners.push(fn);
      return () => { listeners = listeners.filter(l => l !== fn); };
    },
  };
}

export const paperStore = createStore();
