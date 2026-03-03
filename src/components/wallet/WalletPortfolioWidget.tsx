import { motion } from "framer-motion";
import {
  Coins,
  ImageIcon,
  ExternalLink,
  Loader2,
  Wallet,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useWalletPortfolio, type TokenHolding, type NFTHolding } from "@/hooks/useWalletPortfolio";

function shortenAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatUsd(v: number | null) {
  if (v == null) return "—";
  return `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// --- Token row ---
function TokenRow({ token }: { token: TokenHolding }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 rounded-lg gradient-card"
    >
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
        {token.logo ? (
          <img src={token.logo} alt={token.symbol} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <Coins className="w-4 h-4 text-primary" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold truncate">{token.symbol}</span>
          <span className="text-[10px] text-muted-foreground truncate">{token.name}</span>
        </div>
        <p className="text-[10px] text-muted-foreground font-mono">
          {parseFloat(token.balanceFormatted).toLocaleString()} {token.symbol}
        </p>
      </div>
      <div className="text-right shrink-0">
        {token.usdValue != null && token.usdValue > 0 ? (
          <>
            <p className="text-xs font-semibold tabular-nums">{formatUsd(token.usdValue)}</p>
            {token.usdPrice != null && (
              <p className="text-[9px] text-muted-foreground">@{formatUsd(token.usdPrice)}</p>
            )}
          </>
        ) : (
          <p className="text-[10px] text-muted-foreground">—</p>
        )}
      </div>
      <a
        href={`https://cronoscan.com/token/${token.address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-primary shrink-0"
      >
        <ExternalLink className="w-3 h-3" />
      </a>
    </motion.div>
  );
}

// --- NFT card ---
function NftCard({ nft }: { nft: NFTHolding }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="gradient-card rounded-lg overflow-hidden"
    >
      <div className="aspect-square bg-muted/30 flex items-center justify-center">
        {nft.image ? (
          <img
            src={nft.image}
            alt={nft.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
        )}
      </div>
      <div className="p-2">
        <p className="text-[10px] font-semibold truncate">{nft.name}</p>
        <p className="text-[9px] text-muted-foreground truncate">{nft.collectionName}</p>
        <Badge variant="outline" className="text-[8px] mt-1 px-1">
          {nft.tokenType}
        </Badge>
      </div>
    </motion.div>
  );
}

// --- Loading ---
function PortfolioSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-20 rounded-xl" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg gradient-card">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2.5 w-32" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

// --- Empty ---
function EmptyPortfolio() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Wallet className="w-10 h-10 text-muted-foreground/40 mb-3" />
      <p className="text-sm font-medium text-muted-foreground">Aucun actif trouvé</p>
      <p className="text-[11px] text-muted-foreground/60 mt-1">
        Ce wallet ne contient pas de tokens ou NFTs détectés
      </p>
    </div>
  );
}

// --- Main ---
interface Props {
  address: string;
}

export default function WalletPortfolioWidget({ address }: Props) {
  const { data, isLoading, isError, error } = useWalletPortfolio(address);

  if (!address) return null;
  if (isLoading) return <PortfolioSkeleton />;
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <ShieldAlert className="w-8 h-8 text-danger/60 mb-2" />
        <p className="text-xs text-danger">{(error as Error)?.message ?? "Erreur de chargement"}</p>
      </div>
    );
  }
  if (!data) return null;

  const hasTokens = data.tokens.length > 0;
  const hasNfts = data.nfts.length > 0;

  if (!hasTokens && !hasNfts && data.nativeBalance === "0") {
    return <EmptyPortfolio />;
  }

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="gradient-card rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-display font-semibold">Portfolio</h3>
          <Badge variant="outline" className="text-[9px] ml-auto">
            {data.totalTokens} tokens · {data.totalNfts} NFTs
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-primary/10 p-2.5 text-center">
            <p className="text-lg font-mono font-bold tabular-nums">{data.nativeBalance}</p>
            <p className="text-[9px] text-muted-foreground">{data.nativeSymbol}</p>
          </div>
          <div className="rounded-lg bg-accent/30 p-2.5 text-center">
            <p className="text-lg font-mono font-bold tabular-nums">{data.totalTokens}</p>
            <p className="text-[9px] text-muted-foreground">Tokens</p>
          </div>
          <div className="rounded-lg bg-accent/30 p-2.5 text-center">
            <p className="text-lg font-mono font-bold tabular-nums">{data.totalNfts}</p>
            <p className="text-[9px] text-muted-foreground">NFTs</p>
          </div>
        </div>
        {data.totalUsdValue > 0 && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Valeur estimée : <span className="font-semibold text-foreground">{formatUsd(data.totalUsdValue)}</span>
          </p>
        )}
      </div>

      {/* Tokens */}
      {hasTokens && (
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Coins className="w-3 h-3" /> Tokens ({data.tokens.length})
          </h4>
          <div className="space-y-1 max-h-[400px] overflow-y-auto scrollbar-thin">
            {data.tokens.map((t) => (
              <TokenRow key={t.address} token={t} />
            ))}
          </div>
        </div>
      )}

      {/* NFTs */}
      {hasNfts && (
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <ImageIcon className="w-3 h-3" /> NFTs ({data.nfts.length})
          </h4>
          <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto scrollbar-thin">
            {data.nfts.map((n) => (
              <NftCard key={`${n.tokenAddress}-${n.tokenId}`} nft={n} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
