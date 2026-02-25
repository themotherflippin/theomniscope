import { motion } from 'framer-motion';
import type { SmartMoneySignal, WhosBuying } from '@/lib/types';
import { shortenAddress } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { Wallet } from 'lucide-react';

interface SmartMoneyPanelProps {
  whosBuying: WhosBuying;
  signals: SmartMoneySignal[];
  tokenId: string;
}

const typeConfig = {
  accumulation: { label: 'Accumulation', color: 'text-success', bg: 'bg-success/10' },
  distribution: { label: 'Distribution', color: 'text-danger', bg: 'bg-danger/10' },
  rotation: { label: 'Rotation', color: 'text-warning', bg: 'bg-warning/10' },
  new_position: { label: 'New Position', color: 'text-primary', bg: 'bg-primary/10' },
};

export function SmartMoneyPanel({ whosBuying, signals, tokenId }: SmartMoneyPanelProps) {
  const tokenSignals = signals.filter(s => s.tokenId === tokenId);
  const { t } = useI18n();

  return (
    <div className="gradient-card-elevated rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Wallet className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-xs font-display font-semibold text-foreground uppercase tracking-wider">{t('token.whosBuying')}</h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-2 rounded-lg bg-secondary/30">
          <p className={`text-sm font-mono font-bold ${whosBuying.totalSmartMoneyFlow >= 0 ? 'text-success' : 'text-danger'}`}>
            ${Math.abs(whosBuying.totalSmartMoneyFlow / 1000).toFixed(0)}K
          </p>
          <p className="text-[9px] text-muted-foreground mt-0.5">{t('token.netFlow')}</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-secondary/30">
          <p className="text-sm font-mono font-bold text-foreground">{whosBuying.winnerWallets}</p>
          <p className="text-[9px] text-muted-foreground mt-0.5">{t('token.winnerWallets')}</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-secondary/30">
          <p className="text-sm font-mono font-bold text-foreground">{whosBuying.newWallets}</p>
          <p className="text-[9px] text-muted-foreground mt-0.5">{t('token.newWallets')}</p>
        </div>
      </div>

      {whosBuying.topBuyers.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('token.topNetBuyers')}</p>
          {whosBuying.topBuyers.map((b, i) => (
            <motion.div
              key={b.wallet.address}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2 py-1.5"
            >
              <span className="text-[10px] text-muted-foreground/50 w-3 font-mono">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono text-foreground">{b.wallet.label}</span>
                  <Badge variant="outline" className="text-[8px] px-1 py-0 border-border/50 text-muted-foreground">
                    {b.wallet.winRate}% WR
                  </Badge>
                </div>
                <span className="text-[9px] text-muted-foreground font-mono">{shortenAddress(b.wallet.address)}</span>
              </div>
              <span className="text-[11px] font-mono text-success font-medium">
                +${(b.netBuy / 1000).toFixed(1)}K
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {tokenSignals.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-border/30">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('token.smartMoneySignals')}</p>
          {tokenSignals.map(s => {
            const cfg = typeConfig[s.type];
            return (
              <div key={s.id} className={`flex items-start gap-2 p-2 rounded-lg ${cfg.bg}`}>
                <span className={`text-[10px] font-mono font-bold ${cfg.color}`}>{cfg.label}</span>
                <p className="text-[10px] text-secondary-foreground flex-1">{s.detail}</p>
              </div>
            );
          })}
        </div>
      )}

      {whosBuying.topBuyers.length === 0 && tokenSignals.length === 0 && (
        <p className="text-[11px] text-muted-foreground/50 text-center py-4">
          {t('token.noSmartMoney')}
        </p>
      )}
    </div>
  );
}
