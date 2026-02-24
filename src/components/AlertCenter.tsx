import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Alert } from '@/lib/types';
import { timeAgo } from '@/lib/formatters';

interface AlertCenterProps {
  alerts: Alert[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export function AlertCenter({ alerts, unreadCount, onMarkRead, onMarkAllRead }: AlertCenterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-danger text-[10px] font-bold flex items-center justify-center text-danger-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-popover border-border" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h4 className="text-sm font-semibold text-foreground">Alerts</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={onMarkAllRead}>
              <Check className="w-3 h-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto scrollbar-thin">
          {alerts.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">No alerts</p>
          ) : (
            alerts.map(alert => (
              <div
                key={alert.id}
                onClick={() => onMarkRead(alert.id)}
                className={`px-4 py-3 border-b border-border/50 cursor-pointer hover:bg-accent/30 transition-colors ${
                  !alert.read ? 'bg-primary/5' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <p className={`text-xs ${!alert.read ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {alert.message}
                  </p>
                  {!alert.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1 ml-2" />}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 font-mono">{timeAgo(alert.timestamp)}</p>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
