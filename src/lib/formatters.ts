export function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export function formatPrice(p: number): string {
  if (p < 0.0001) return `$${p.toFixed(8)}`;
  if (p < 0.01) return `$${p.toFixed(6)}`;
  if (p < 1) return `$${p.toFixed(4)}`;
  return `$${p.toFixed(2)}`;
}

export function formatPct(p: number): string {
  const sign = p >= 0 ? '+' : '';
  return `${sign}${p.toFixed(1)}%`;
}

export function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function timeAgo(ms: number): string {
  const sec = Math.floor((Date.now() - ms) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

export function chainLabel(chain: string): string {
  const labels: Record<string, string> = {
    ethereum: 'ETH',
    bsc: 'BSC',
    arbitrum: 'ARB',
    polygon: 'POLY',
  };
  return labels[chain] || chain.toUpperCase();
}

export function dexLabel(dex: string): string {
  const labels: Record<string, string> = {
    uniswap_v2: 'Uni V2',
    uniswap_v3: 'Uni V3',
    pancakeswap: 'PCS',
    sushiswap: 'Sushi',
  };
  return labels[dex] || dex;
}
