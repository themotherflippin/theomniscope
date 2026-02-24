import { useMarketData } from '@/hooks/useMarketData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { timeAgo } from '@/lib/formatters';
import { Bell, Check, Zap, ShieldAlert, TrendingUp, BarChart3 } from 'lucide-react';

const typeIcons: Record<string, React.ElementType> = {
  signal: Zap,
  risk: ShieldAlert,
  price: TrendingUp,
  volume: BarChart3,
};

const typeColors: Record<string, string> = {
  signal: 'text-success',
  risk: 'text-danger',
  price: 'text-primary',
  volume: 'text-warning',
};

export default function AlertsPage() {
  const { alerts, unreadAlerts, markAlertRead, markAllRead } = useMarketData();

  return (
    <div>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Alertes
            {unreadAlerts > 0 && (
              <Badge className="bg-danger/20 text-danger border-danger/30 text-[10px]">
                {unreadAlerts} new
              </Badge>
            )}
          </h1>
          {unreadAlerts > 0 && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={markAllRead}>
              <Check className="w-3 h-3 mr-1" /> Tout lire
            </Button>
          )}
        </div>
      </header>

      <main className="px-4 py-2">
        {alerts.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aucune alerte pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {alerts.map(alert => {
              const Icon = typeIcons[alert.type] || Bell;
              const color = typeColors[alert.type] || 'text-muted-foreground';
              return (
                <div
                  key={alert.id}
                  onClick={() => markAlertRead(alert.id)}
                  className={`flex items-start gap-3 px-3 py-3 border-b border-border/50 cursor-pointer transition-colors ${
                    !alert.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!alert.read ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {alert.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-1">{timeAgo(alert.timestamp)}</p>
                  </div>
                  {!alert.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
