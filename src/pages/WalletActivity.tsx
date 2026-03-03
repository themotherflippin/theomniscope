import { useSearchParams } from "react-router-dom";
import { ArrowLeft, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import WalletActivityWidget from "@/components/WalletActivityWidget";

export default function WalletActivity() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const walletParam = searchParams.get("wallet") || undefined;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="px-4 pt-3 pb-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Wallet className="w-4 h-4 text-primary" />
          <h1 className="text-base font-display font-bold text-foreground tracking-tight">
            Wallet Activity
          </h1>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1 ml-10">
          Suivez les mouvements on-chain en temps réel, identifiez les transferts suspects et explorez les clusters associés.
        </p>
      </div>
      <main className="px-4 py-4">
        <WalletActivityWidget initialAddress={walletParam} />
      </main>
    </div>
  );
}
