import { Outlet, useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { GlobalSearch } from "./GlobalSearch";
import { AiAssistant } from "./AiAssistant";

interface AppShellProps {
  unreadAlerts: number;
}

export function AppShell({ unreadAlerts }: AppShellProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background gradient-hero">
      {/* Fixed top search bar with glass blur */}
      <div
        className="fixed top-0 left-0 right-0 z-40 border-b border-border/20 px-3 py-1.5 bg-background/80 backdrop-blur-xl flex items-center gap-2"
        style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 6px)" }}
      >
        <div className="flex-1 min-w-0">
          <GlobalSearch />
        </div>
        <button
          onClick={() => navigate("/profile")}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent/50 transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      {/* Content with top offset for fixed header */}
      <div
        className="pb-20"
        style={{ paddingTop: "calc(max(env(safe-area-inset-top, 0px), 6px) + 44px)" }}
      >
        <Outlet />
      </div>
      <BottomNav unreadAlerts={unreadAlerts} />
      <AiAssistant />
    </div>
  );
}
