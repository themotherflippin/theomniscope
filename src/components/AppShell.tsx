import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { Disclaimer } from "./Disclaimer";
import { GlobalSearch } from "./GlobalSearch";
import { AiAssistant } from "./AiAssistant";

interface AppShellProps {
  unreadAlerts: number;
}

export function AppShell({ unreadAlerts }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background gradient-hero">
      <Disclaimer />
      {/* Fixed top search bar with glass blur */}
      <div
        className="fixed top-0 left-0 right-0 z-40 border-b border-border/30 px-3 py-1.5 glass-strong safe-area-top"
        style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 6px)" }}
      >
        <GlobalSearch />
      </div>
      {/* Content with top offset for fixed header */}
      <div className="pt-12 pb-20 safe-area-top">
        <Outlet />
      </div>
      <BottomNav unreadAlerts={unreadAlerts} />
      <AiAssistant />
    </div>
  );
}
