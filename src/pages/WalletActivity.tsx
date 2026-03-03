import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, Activity, Briefcase, Network, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import WalletActivityWidget from "@/components/WalletActivityWidget";
import WalletPortfolioWidget from "@/components/wallet/WalletPortfolioWidget";
import { useI18n } from "@/lib/i18n";

export default function WalletActivity() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const walletParam = searchParams.get("wallet") || "";

  const [inputValue, setInputValue] = useState(walletParam);
  const [activeAddress, setActiveAddress] = useState(walletParam);

  useEffect(() => {
    const w = searchParams.get("wallet") || "";
    if (w && /^0x[a-fA-F0-9]{40}$/.test(w)) {
      setInputValue(w);
      setActiveAddress(w);
    }
  }, [searchParams]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
        setActiveAddress(trimmed);
        setSearchParams({ wallet: trimmed });
      }
    },
    [inputValue, setSearchParams]
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="px-4 pt-3 pb-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Wallet className="w-4 h-4 text-primary" />
          <h1 className="text-base font-display font-bold text-foreground tracking-tight">
            {t('wallet.explorerTitle')}
          </h1>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1 ml-10">
          {t('wallet.explorerDesc')}
        </p>
      </div>

      <main className="px-4 py-4 space-y-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('wallet.placeholder')}
              className="pl-9 text-xs bg-card border-border font-mono"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={!/^0x[a-fA-F0-9]{40}$/.test(inputValue.trim())}
          >
            {t('wallet.explore')}
          </Button>
        </form>

        {!activeAddress && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <Wallet className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {t('wallet.enterAddress')}
            </p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">
              {t('wallet.enterAddressDesc')}
            </p>
          </div>
        )}

        {activeAddress && (
          <Tabs defaultValue="portfolio" className="w-full">
            <TabsList className="w-full grid grid-cols-3 bg-muted/30">
              <TabsTrigger value="portfolio" className="text-xs gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                {t('wallet.portfolio')}
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                {t('wallet.activity')}
              </TabsTrigger>
              <TabsTrigger value="scanner" className="text-xs gap-1.5">
                <Network className="w-3.5 h-3.5" />
                {t('wallet.scanner')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="portfolio" className="mt-4">
              <WalletPortfolioWidget address={activeAddress} />
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <WalletActivityWidget initialAddress={activeAddress} />
            </TabsContent>

            <TabsContent value="scanner" className="mt-4">
              <div className="text-center py-4">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/wallet/${activeAddress}`)}
                  className="gap-2"
                >
                  <Network className="w-4 h-4" />
                  {t('wallet.openFullScanner')}
                </Button>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {t('wallet.fullScannerDesc')}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
