import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { OpportunityScore } from '@/lib/types';
import { paperStore } from '@/lib/paperStore';
import { toast } from '@/hooks/use-toast';
import {
  Target, Eye, Ban, Copy, Bookmark, TrendingUp, AlertTriangle, ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';

interface OpportunityCardProps {
  opp: OpportunityScore;
  onClick?: () => void;
}

const gradeColors: Record<string, string> = {
  S: 'bg-success/15 text-success border-success/25',
  A: 'bg-success/10 text-success border-success/20',
  B: 'bg-primary/10 text-primary border-primary/20',
  C: 'bg-warning/10 text-warning border-warning/20',
  D: 'bg-danger/10 text-danger border-danger/20',
  F: 'bg-danger/15 text-danger border-danger/30',
};

const actionColors: Record<string, string> = {
  STRONG_BUY: 'text-success',
  BUY: 'text-primary',
  WATCH: 'text-warning',
  AVOID: 'text-danger',
};

const actionLabels: Record<string, string> = {
  STRONG_BUY: 'STRONG BUY',
  BUY: 'BUY',
  WATCH: 'WATCH',
  AVOID: 'AVOID',
};

export function OpportunityCard({ opp, onClick }: OpportunityCardProps) {
  const [showPlan, setShowPlan] = useState(false);
  const isTracked = paperStore.isTracked(opp.tokenId);
  const isIgnored = paperStore.isIgnored(opp.tokenId);

  if (isIgnored) return null;

  const handleTrack = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTracked) {
      paperStore.untrackToken(opp.tokenId);
      toast({ title: `${opp.tokenSymbol} removed from tracking` });
    } else {
      paperStore.trackToken(opp.tokenId);
      toast({ title: `${opp.tokenSymbol} tracked — alerts active` });
    }
  };

  const handleIgnore = (e: React.MouseEvent) => {
    e.stopPropagation();
    paperStore.ignoreToken(opp.tokenId);
    toast({ title: `${opp.tokenSymbol} ignored`, description: 'Won\'t appear in your feed.' });
  };

  const handleCopyPlan = (e: React.MouseEvent) => {
    e.stopPropagation();
    const plan = `📊 ${opp.tokenSymbol} — ${actionLabels[opp.action]}
Score: ${opp.totalScore}/100 (${opp.grade})
Entry: ${opp.entryZone}
Stop: ${opp.stopLoss}
TP1: ${opp.takeProfit1}
TP2: ${opp.takeProfit2}
R:R ${opp.riskRewardRatio}:1
Slippage est: ${opp.estimatedSlippage.toFixed(2)}%

Why:
${opp.topReasons.map(r => `• ${r}`).join('\n')}

⚠ ${opp.invalidation}
— ORACLE`;

    navigator.clipboard.writeText(plan);
    toast({ title: 'Trade plan copied!', description: 'Ready to paste in Telegram/Notes.' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`gradient-card-elevated rounded-xl overflow-hidden ${opp.capped ? 'border-danger/20' : ''}`}
    >
      {/* Header */}
      <div onClick={onClick} className="p-4 cursor-pointer">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center font-bold font-mono text-sm">
                {opp.tokenSymbol.slice(0, 2)}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold font-mono ${gradeColors[opp.grade]}`}>
                {opp.grade}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">{opp.tokenSymbol}</span>
                <span className={`text-[11px] font-mono font-bold ${actionColors[opp.action]}`}>
                  {actionLabels[opp.action]}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">
                Score {opp.totalScore}/100 {opp.capped && '• CAPPED ⛔'}
              </p>
            </div>
          </div>

          {/* Score ring */}
          <div className="relative w-12 h-12">
            <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--muted))" strokeWidth="2.5" />
              <circle
                cx="18" cy="18" r="15.5" fill="none"
                stroke={opp.capped ? 'hsl(var(--danger))' : opp.totalScore >= 60 ? 'hsl(var(--success))' : opp.totalScore >= 40 ? 'hsl(var(--primary))' : 'hsl(var(--warning))'}
                strokeWidth="2.5"
                strokeDasharray={`${(opp.totalScore / 100) * 97.4} 97.4`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold text-foreground">
              {opp.totalScore}
            </span>
          </div>
        </div>

        {/* Factor bars */}
        <div className="space-y-1.5 mb-3">
          {opp.factors.map(f => (
            <div key={f.name} className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-16 flex-shrink-0">{f.name}</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(f.score / 20) * 100}%` }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: f.score >= 15 ? 'hsl(var(--success))' : f.score >= 10 ? 'hsl(var(--primary))' : f.score >= 5 ? 'hsl(var(--warning))' : 'hsl(var(--danger))',
                  }}
                />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground w-6 text-right">{f.score}</span>
            </div>
          ))}
        </div>

        {/* Top reasons */}
        <div className="space-y-1">
          {opp.topReasons.slice(0, 3).map((r, i) => (
            <p key={i} className="text-[11px] text-secondary-foreground flex items-start gap-1.5 leading-relaxed">
              <span className={`mt-0.5 text-xs ${r.startsWith('⛔') ? 'text-danger' : 'text-primary'}`}>▸</span>
              {r}
            </p>
          ))}
        </div>

        {/* Execution warning */}
        {opp.estimatedSlippage > 1 && (
          <div className="flex items-center gap-1.5 mt-2 p-2 rounded-lg bg-warning/5 border border-warning/10">
            <AlertTriangle className="w-3 h-3 text-warning flex-shrink-0" />
            <span className="text-[10px] text-warning/80">
              Est. slippage: {opp.estimatedSlippage.toFixed(2)}% • Impact: {opp.priceImpact.toFixed(3)}% for $1K
            </span>
          </div>
        )}
      </div>

      {/* Trade Plan (expandable) */}
      {showPlan && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="px-4 pb-3 border-t border-border/30 pt-3"
        >
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] font-mono">
            <div><span className="text-muted-foreground">Entry </span><span className="text-foreground">{opp.entryZone}</span></div>
            <div><span className="text-muted-foreground">Stop </span><span className="text-danger">{opp.stopLoss}</span></div>
            <div><span className="text-muted-foreground">TP1 </span><span className="text-success">{opp.takeProfit1}</span></div>
            <div><span className="text-muted-foreground">TP2 </span><span className="text-success">{opp.takeProfit2}</span></div>
            <div><span className="text-muted-foreground">R:R </span><span className="text-foreground">{opp.riskRewardRatio}:1</span></div>
            <div><span className="text-muted-foreground">Slip </span><span className="text-warning">{opp.estimatedSlippage.toFixed(2)}%</span></div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">⚠ {opp.invalidation}</p>
        </motion.div>
      )}

      {/* Action bar */}
      <div className="flex items-center border-t border-border/30 divide-x divide-border/30">
        <button
          onClick={handleTrack}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium transition-colors ${
            isTracked ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" fill={isTracked ? 'currentColor' : 'none'} />
          {isTracked ? 'Tracked' : 'Track'}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setShowPlan(!showPlan); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Target className="w-3.5 h-3.5" />
          Plan
        </button>
        <button
          onClick={handleCopyPlan}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
          Copy
        </button>
        <button
          onClick={handleIgnore}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium text-muted-foreground hover:text-danger transition-colors"
        >
          <Ban className="w-3.5 h-3.5" />
          Ignore
        </button>
      </div>
    </motion.div>
  );
}
