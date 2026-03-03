import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarketData } from '@/hooks/useMarketData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { timeAgo } from '@/lib/formatters';
import { useI18n } from '@/lib/i18n';
import { Bell, Check, Zap, ShieldAlert, TrendingUp, BarChart3, Filter, Droplets, Brain, X, Clock, AlertTriangle } from 'lucide-react';
import type { Alert } from '@/lib/types';

const typeIcons: Record<string, React.ElementType> = {
  signal: Zap, risk: ShieldAlert, price: TrendingUp, volume: BarChart3,
  liquidity_drain: Droplets, tax_change: ShieldAlert, smart_money: Brain,
};
const typeLabelsStatic: Record<string, string> = {
  signal: 'Signal', risk: 'Risk', price: 'Price', volume: 'Volume',
  liquidity_drain: 'Liquidity', tax_change: 'Tax', smart_money: 'Smart Money',
};
const priorityColors: Record<string, { color: string; bg: string }> = {
  critical: { color: 'text-danger', bg: 'bg-danger/10 border-danger/20' },
  high: { color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
  medium: { color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
  low: { color: 'text-muted-foreground', bg: 'bg-secondary/50 border-border/30' },
};

type TypeFilter = 'all' | 'price' | 'volume' | 'signal' | 'risk' | 'liquidity_drain' | 'tax_change' | 'smart_money';
type PriorityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';

function groupByTime(alerts: Alert[], t: (k: any) => string): { label: string; icon: React.ElementType; alerts: Alert[] }[] {
  const now = Date.now();
  const groups: { label: string; icon: React.ElementType; alerts: Alert[] }[] = [
    { label: t('alerts.timeNow'), icon: Zap, alerts: [] },
    { label: t('alerts.timeLastHour'), icon: Clock, alerts: [] },
    { label: t('alerts.timeToday'), icon: Clock, alerts: [] },
    { label: t('alerts.timeOlder'), icon: Clock, alerts: [] },
  ];
  for (const a of alerts) {
    const diff = now - a.timestamp;
    if (diff < 5 * 60_000) groups[0].alerts.push(a);
    else if (diff < 60 * 60_000) groups[1].alerts.push(a);
    else if (diff < 24 * 60 * 60_000) groups[2].alerts.push(a);
    else groups[3].alerts.push(a);
  }
  return groups.filter(g => g.alerts.length > 0);
}

export default function AlertsPage() {
  const { alerts, unreadAlerts, markAlertRead, markAllRead } = useMarketData();
  const { t } = useI18n();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => alerts.filter(a => {
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    if (priorityFilter !== 'all' && a.priority !== priorityFilter) return false;
    return true;
  }), [alerts, typeFilter, priorityFilter]);

  const grouped = useMemo(() => groupByTime(filtered, t), [filtered, t]);

  const activeCount = (typeFilter !== 'all' ? 1 : 0) + (priorityFilter !== 'all' ? 1 : 0);
  const resetFilters = () => { setTypeFilter('all'); setPriorityFilter('all'); };

  const criticalCount = alerts.filter(a => a.priority === 'critical' && !a.read).length;

  const typeLabels: Record<string, string> = {
    signal: t('alerts.filterSignal'), risk: t('alerts.filterRisk'), price: t('alerts.filterPrice'),
    volume: t('alerts.filterVolume'), liquidity_drain: t('alerts.filterLiquidity'),
    tax_change: 'Tax', smart_money: 'Smart Money',
  };

  const priorityLabels: Record<string, string> = {
    critical: t('alerts.priorityCritical'), high: t('alerts.priorityHigh'),
    medium: t('alerts.priorityMedium'), low: t('alerts.priorityLow'),
  };

  const typeOptions: { key: TypeFilter; label: string; icon: React.ElementType }[] = [
    { key: 'all', label: t('alerts.filterAll'), icon: Bell },
    { key: 'signal', label: t('alerts.filterSignal'), icon: Zap },
    { key: 'risk', label: t('alerts.filterRisk'), icon: ShieldAlert },
    { key: 'price', label: t('alerts.filterPrice'), icon: TrendingUp },
    { key: 'volume', label: t('alerts.filterVolume'), icon: BarChart3 },
    { key: 'smart_money', label: 'Smart Money', icon: Brain },
    { key: 'liquidity_drain', label: t('alerts.filterLiquidity'), icon: Droplets },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-strong border-b border-border/50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bell className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-display font-bold text-foreground tracking-tight">{t('alerts.title')}</h1>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {t('alerts.count').replace('{unread}', String(unreadAlerts)).replace('alerts', `${alerts.length} ${t('alerts.title').toLowerCase()}`)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${showFilters ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-3.5 h-3.5" />
                {activeCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary text-[8px] font-bold flex items-center justify-center text-primary-foreground">
                    {activeCount}
                  </span>
                )}
              </Button>
              {unreadAlerts > 0 && (
              <Button variant="ghost" size="sm" className="text-[10px] text-muted-foreground h-8 px-2" onClick={markAllRead}>
                  <Check className="w-3 h-3 mr-1" /> {t('alerts.markAllRead')}
                </Button>
              )}
            </div>
          </div>

          {/* Critical banner */}
          {criticalCount > 0 && !showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-2 px-3 py-2 rounded-lg bg-danger/8 border border-danger/15 flex items-center gap-2"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-danger flex-shrink-0" />
              <span className="text-[11px] text-danger font-medium">
                {t('alerts.criticalPending').replace('{count}', String(criticalCount))}
              </span>
            </motion.div>
          )}
        </div>

        {/* Info description */}
        <p className="px-4 pb-2 text-[10px] text-muted-foreground leading-relaxed">
          📡 {t('alerts.monitoringDesc')}
        </p>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 space-y-3">
                {/* Type chips */}
                <div>
                  <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-widest">Type</span>
                  <div className="flex gap-1.5 mt-1.5 overflow-x-auto scrollbar-none pb-0.5">
                    {typeOptions.map(opt => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => setTypeFilter(opt.key)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all ${
                            typeFilter === opt.key
                              ? 'bg-primary/15 text-primary border border-primary/25 shadow-sm shadow-primary/5'
                              : 'bg-secondary/40 text-muted-foreground border border-transparent hover:bg-secondary/70'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* Priority chips */}
                <div>
                  <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-widest">{t('alerts.priorityLabel')}</span>
                  <div className="flex gap-1.5 mt-1.5">
                    {(['all', 'critical', 'high', 'medium', 'low'] as PriorityFilter[]).map(key => (
                      <button
                        key={key}
                        onClick={() => setPriorityFilter(key)}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all ${
                          priorityFilter === key
                            ? 'bg-primary/15 text-primary border border-primary/25 shadow-sm shadow-primary/5'
                            : 'bg-secondary/40 text-muted-foreground border border-transparent hover:bg-secondary/70'
                        }`}
                      >
                        {key === 'all' ? t('alerts.priorityAll') : priorityLabels[key] || key}
                      </button>
                    ))}
                  </div>
                </div>
                {activeCount > 0 && (
                  <button onClick={resetFilters} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-3 h-3" /> {t('alerts.resetFilters')}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Info banner */}
      <div className="px-4 pt-3">
        <div className="rounded-xl bg-primary/5 border border-primary/10 px-3 py-2.5">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            📡 {t('alerts.monitoringDesc')}
          </p>
        </div>
      </div>

      {/* Alert list grouped by time */}
      <main className="px-3 py-2 pb-24">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-3">
              <Bell className="w-5 h-5 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">
              {activeCount > 0 ? t('alerts.noMatch') : t('alerts.none')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map(group => (
              <section key={group.label}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <group.icon className="w-3 h-3 text-muted-foreground/50" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{group.label}</span>
                  <span className="text-[9px] text-muted-foreground/40 font-mono">{group.alerts.length}</span>
                </div>
                <div className="space-y-1.5">
                  {group.alerts.map((alert, i) => (
                    <AlertItem key={alert.id} alert={alert} index={i} onRead={markAlertRead} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function AlertItem({ alert, index, onRead }: { alert: Alert; index: number; onRead: (id: string) => void }) {
  const Icon = typeIcons[alert.type] || Bell;
  const pConfig = priorityColors[alert.priority] || priorityColors.low;
  const typeLabel = typeLabelsStatic[alert.type] || alert.type;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.015 }}
      onClick={() => onRead(alert.id)}
      className={`relative flex items-start gap-3 px-3 py-3 rounded-xl border cursor-pointer transition-all ${
        !alert.read
          ? 'bg-card/80 border-border/60 shadow-sm'
          : 'bg-transparent border-transparent hover:bg-accent/15'
      }`}
    >
      {/* Icon */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${pConfig.bg}`}>
        <Icon className={`w-3.5 h-3.5 ${pConfig.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <Badge variant="outline" className={`text-[8px] px-1.5 py-0 h-4 font-semibold ${pConfig.bg} ${pConfig.color} border`}>
            {alert.priority.toUpperCase()}
          </Badge>
          <span className="text-[9px] text-muted-foreground/60 font-mono">{typeLabel}</span>
          <span className="text-[9px] text-muted-foreground/40">·</span>
          <span className="text-[9px] text-muted-foreground/50 font-mono">{alert.tokenSymbol}</span>
        </div>
        <p className={`text-[11px] leading-relaxed ${!alert.read ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
          {alert.message}
        </p>
        <p className="text-[9px] text-muted-foreground/40 font-mono mt-1">{timeAgo(alert.timestamp)}</p>
      </div>

      {/* Unread dot */}
      {!alert.read && (
        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-3 animate-pulse" />
      )}
    </motion.div>
  );
}
