import { useLocation, useNavigate } from 'react-router-dom';
import { Radar, Zap, Star, Bell, User } from 'lucide-react';

const tabs = [
  { path: '/', label: 'Radar', icon: Radar },
  { path: '/opportunities', label: 'Opps', icon: Zap },
  { path: '/watchlists', label: 'Watchlists', icon: Star },
  { path: '/alerts', label: 'Alertes', icon: Bell },
  { path: '/profile', label: 'Profil', icon: User },
];

interface BottomNavProps {
  unreadAlerts?: number;
}

export function BottomNav({ unreadAlerts = 0 }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide on token detail
  if (location.pathname.startsWith('/token/')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map(tab => {
          const isActive = tab.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(tab.path);
          const Icon = tab.icon;

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 min-w-[64px] transition-colors relative ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {tab.path === '/alerts' && unreadAlerts > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-danger text-[9px] font-bold flex items-center justify-center text-danger-foreground">
                    {unreadAlerts > 9 ? '9+' : unreadAlerts}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
