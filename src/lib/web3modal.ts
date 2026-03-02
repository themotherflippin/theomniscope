import { createWeb3Modal, defaultConfig } from "@web3modal/ethers/react";

const projectId = "5d6996fd9d8d386ba3881045a32894f6";

const metadata = {
  name: "Oracle System",
  description: "Oracle Intelligence Platform",
  url: window.location.origin,
  icons: [window.location.origin + "/favicon.png"],
};

const ethereum = {
  chainId: 1,
  name: "Ethereum",
  currency: "ETH",
  explorerUrl: "https://etherscan.io",
  rpcUrl: "https://eth.drpc.org",
};

const cronos = {
  chainId: 25,
  name: "Cronos",
  currency: "CRO",
  explorerUrl: "https://cronoscan.com",
  rpcUrl: "https://evm.cronos.org",
};

const bsc = {
  chainId: 56,
  name: "BNB Smart Chain",
  currency: "BNB",
  explorerUrl: "https://bscscan.com",
  rpcUrl: "https://bsc-dataseed.binance.org",
};

const polygon = {
  chainId: 137,
  name: "Polygon",
  currency: "MATIC",
  explorerUrl: "https://polygonscan.com",
  rpcUrl: "https://polygon-rpc.com",
};

const arbitrum = {
  chainId: 42161,
  name: "Arbitrum",
  currency: "ETH",
  explorerUrl: "https://arbiscan.io",
  rpcUrl: "https://arb1.arbitrum.io/rpc",
};

const base = {
  chainId: 8453,
  name: "Base",
  currency: "ETH",
  explorerUrl: "https://basescan.org",
  rpcUrl: "https://mainnet.base.org",
};

const ethersConfig = defaultConfig({
  metadata,
  defaultChainId: 1,
  enableEIP6963: true,
  enableInjected: true,
  enableCoinbase: false,
});

createWeb3Modal({
  ethersConfig,
  chains: [ethereum, cronos, bsc, polygon, arbitrum, base],
  projectId,
  enableAnalytics: false,
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "hsl(200, 100%, 50%)",
    "--w3m-border-radius-master": "2px",
  },
});

export { projectId };
