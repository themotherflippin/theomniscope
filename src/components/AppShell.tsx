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
      {/* Top search bar */}
      <div className="sticky top-0 z-40 glass-strong border-b border-border/50 px-3 py-2">
        <GlobalSearch />
      </div>
      <div className="pb-20">
        <Outlet />
      </div>
      <BottomNav unreadAlerts={unreadAlerts} />
      <AiAssistant />
    </div>
  );
}
