import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DailyBrief as DailyBriefType } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Sun, TrendingUp, ShieldAlert, Wallet, ArrowRight } from 'lucide-react';

interface DailyBriefProps {
  brief: DailyBriefType;
  onClose: () => void;
  onSelectToken: (tokenId: string) => void;
}

const sentimentConfig = {
  bullish: { label: 'Bullish', color: 'text-success', bg: 'bg-success/10' },
  neutral: { label: 'Neutral', color: 'text-muted-foreground', bg: 'bg-secondary' },
  bearish: { label: 'Bearish', color: 'text-danger', bg: 'bg-danger/10' },
};

export function DailyBrief({ brief, onClose, onSelectToken }: DailyBriefProps) {
  const sentCfg = sentimentConfig[brief.marketSentiment];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-md flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md max-h-[85vh] overflow-y-auto bg-card border border-border/50 rounded-t-2xl sm:rounded-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 glass-strong border-b border-border/30 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-warning" />
            <h2 className="text-base font-display font-bold text-foreground">Daily Brief</h2>
          </div>
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-5 space-y-5">
          {/* Market sentiment */}
          <div className="flex items-center gap-3">
            <Badge className={`${sentCfg.bg} ${sentCfg.color} border-none text-xs font-mono`}>
              {sentCfg.label}
            </Badge>
            <span className="text-xs text-muted-foreground">{brief.smartMoneyTrend}</span>
          </div>

          {/* Top Opportunities */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-success" />
              <h3 className="text-xs font-display font-semibold text-foreground uppercase tracking-wider">Top Opportunities</h3>
            </div>
            {brief.topOpportunities.length === 0 ? (
              <div className="p-4 rounded-lg bg-secondary/30 text-center">
                <p className="text-[11px] text-muted-foreground">No strong opportunities right now.</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">Market conditions may not favor entries — patience is a strategy.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {brief.topOpportunities.map((opp, i) => (
                  <motion.button
                    key={opp.tokenId}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => { onSelectToken(opp.tokenId); onClose(); }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-accent/30 transition-colors text-left"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                      opp.grade === 'S' || opp.grade === 'A' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
                    }`}>
                      {opp.grade}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">{opp.tokenSymbol}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">Score {opp.totalScore}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{opp.topReasons[0]}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Top Dangers */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="w-4 h-4 text-danger" />
              <h3 className="text-xs font-display font-semibold text-foreground uppercase tracking-wider">Top Dangers</h3>
            </div>
            {brief.topDangers.length === 0 ? (
              <div className="p-4 rounded-lg bg-success/5 text-center">
                <p className="text-[11px] text-success/80">All monitored tokens within acceptable risk.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {brief.topDangers.map((d, i) => (
                  <motion.button
                    key={d.token.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + 0.2 }}
                    onClick={() => { onSelectToken(d.token.id); onClose(); }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-danger/5 hover:bg-danger/10 transition-colors text-left border border-danger/10"
                  >
                    <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center">
                      <ShieldAlert className="w-4 h-4 text-danger" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">{d.token.symbol}</span>
                        <span className="text-[10px] font-mono text-danger">Risk {d.risk.score}</span>
                      </div>
                      <p className="text-[10px] text-danger/70 truncate">{d.reason}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
