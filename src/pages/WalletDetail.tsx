import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import FullWalletScanner from "@/components/scanner/FullWalletScanner";
import { FeatureGate } from "@/components/FeatureGate";

export default function WalletDetail() {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();

  return (
    <FeatureGate feature="scanner">
    <div className="max-w-4xl mx-auto">
      <div className="px-4 pt-3 pb-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-base font-display font-bold text-foreground tracking-tight">
            Wallet Intelligence
          </h1>
        </div>
      </div>
      <main className="px-4 py-4">
        <FullWalletScanner initialAddress={address} />
      </main>
    </div>
    </FeatureGate>
  );
}
