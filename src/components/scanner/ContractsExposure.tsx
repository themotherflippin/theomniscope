import { motion } from "framer-motion";
import { ExternalLink, Shield, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { shortenAddress } from "@/lib/formatters";
import type { ContractResult } from "@/lib/walletScanner.types";

interface ContractsExposureProps {
  contracts: ContractResult[];
}

export default function ContractsExposure({ contracts }: ContractsExposureProps) {
  if (contracts.length === 0) {
    return (
      <div className="text-center py-8">
        <Shield className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">No contract interactions detected</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-h-[500px] overflow-y-auto scrollbar-thin">
      {contracts.map((contract, i) => (
        <motion.div
          key={contract.address}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
          className="gradient-card rounded-lg p-3 flex items-center gap-3"
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              contract.isRouter ? "bg-warning/15" : "bg-primary/10"
            }`}
          >
            {contract.isRouter ? (
              <Zap className="w-4 h-4 text-warning" />
            ) : (
              <Shield className="w-4 h-4 text-primary" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold truncate">
                {shortenAddress(contract.address)}
              </span>
              {contract.isRouter && (
                <Badge variant="outline" className="text-[8px] bg-warning/15 text-warning border-warning/30">
                  DEX Router
                </Badge>
              )}
              {contract.label && !contract.isRouter && (
                <Badge variant="outline" className="text-[8px]">{contract.label}</Badge>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {contract.txCount} interaction{contract.txCount > 1 ? "s" : ""}
            </p>
          </div>

          <a
            href={`https://cronoscan.com/address/${contract.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </motion.div>
      ))}
    </div>
  );
}
