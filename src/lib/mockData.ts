import type { Token, Chain, DEX, CandleData } from './types';

const SYMBOLS = [
  { symbol: 'PEPE', name: 'Pepe', chain: 'ethereum' as Chain, dex: 'uniswap_v3' as DEX },
  { symbol: 'WOJAK', name: 'Wojak', chain: 'ethereum' as Chain, dex: 'uniswap_v2' as DEX },
  { symbol: 'ARB', name: 'Arbitrum', chain: 'arbitrum' as Chain, dex: 'uniswap_v3' as DEX },
  { symbol: 'CAKE', name: 'PancakeSwap', chain: 'bsc' as Chain, dex: 'pancakeswap' as DEX },
  { symbol: 'SHIB', name: 'Shiba Inu', chain: 'ethereum' as Chain, dex: 'uniswap_v2' as DEX },
  { symbol: 'DOGE2', name: 'Doge 2.0', chain: 'bsc' as Chain, dex: 'pancakeswap' as DEX },
  { symbol: 'MATIC', name: 'Polygon', chain: 'polygon' as Chain, dex: 'uniswap_v3' as DEX },
  { symbol: 'FLOKI', name: 'Floki', chain: 'bsc' as Chain, dex: 'pancakeswap' as DEX },
  { symbol: 'TURBO', name: 'Turbo', chain: 'ethereum' as Chain, dex: 'uniswap_v3' as DEX },
  { symbol: 'MEME', name: 'Memecoin', chain: 'ethereum' as Chain, dex: 'uniswap_v2' as DEX },
  { symbol: 'BONK', name: 'Bonk', chain: 'ethereum' as Chain, dex: 'uniswap_v3' as DEX },
  { symbol: 'WIF', name: 'dogwifhat', chain: 'ethereum' as Chain, dex: 'uniswap_v3' as DEX },
  { symbol: 'NEIRO', name: 'Neiro', chain: 'base' as Chain, dex: 'uniswap_v3' as DEX },
  { symbol: 'MOG', name: 'Mog Coin', chain: 'base' as Chain, dex: 'uniswap_v3' as DEX },
  { symbol: 'BRETT', name: 'Brett', chain: 'base' as Chain, dex: 'uniswap_v2' as DEX },
  { symbol: 'AERO', name: 'Aerodrome', chain: 'base' as Chain, dex: 'sushiswap' as DEX },
  { symbol: 'VIRTUAL', name: 'Virtual', chain: 'base' as Chain, dex: 'uniswap_v3' as DEX },
];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number) {
  return Math.floor(rand(min, max));
}

function generateAddress(): string {
  return '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export function generateMockTokens(): Token[] {
  return SYMBOLS.map((s, i) => {
    const price = rand(0.000001, 5);
    const ema20 = price * rand(0.95, 1.05);
    const ema50 = price * rand(0.9, 1.1);
    const volume24h = rand(50000, 20000000);
    const buyCount = randInt(200, 5000);
    const sellCount = randInt(150, 4000);
    
    return {
      id: `token-${i}`,
      symbol: s.symbol,
      name: s.name,
      address: generateAddress(),
      chain: s.chain,
      dex: s.dex,
      price,
      priceChange5m: rand(-8, 12),
      priceChange1h: rand(-15, 25),
      priceChange24h: rand(-30, 80),
      volume5m: volume24h * rand(0.005, 0.05),
      volume1h: volume24h * rand(0.05, 0.2),
      volume24h,
      liquidity: rand(100000, 10000000),
      marketCap: rand(500000, 500000000),
      txCount24h: buyCount + sellCount,
      buyCount,
      sellCount,
      holders: randInt(500, 50000),
      ageHours: rand(2, 8760),
      volatility: rand(5, 80),
      rsi: rand(15, 90),
      ema20,
      ema50,
      vwap: price * rand(0.97, 1.03),
      atr: price * rand(0.02, 0.1),
      isFavorite: Math.random() > 0.7,
      tags: Math.random() > 0.5 ? ['meme'] : ['defi'],
    };
  });
}

export function generateCandles(basePrice: number, count: number = 100): CandleData[] {
  const candles: CandleData[] = [];
  let price = basePrice;
  const now = Date.now();

  for (let i = count; i >= 0; i--) {
    const change = price * rand(-0.05, 0.05);
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) * (1 + rand(0, 0.02));
    const low = Math.min(open, close) * (1 - rand(0, 0.02));

    candles.push({
      time: now - i * 60000 * 5,
      open,
      high,
      low,
      close,
      volume: rand(10000, 500000),
    });

    price = close;
  }

  return candles;
}
