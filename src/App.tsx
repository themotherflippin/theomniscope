import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { useUserPreferences } from "@/lib/userPreferences";
import { useMarketData } from "@/hooks/useMarketData";
import { AppShell } from "@/components/AppShell";
import Onboarding from "@/pages/Onboarding";
import Radar from "@/pages/Radar";
import Opportunities from "@/pages/Opportunities";
import Watchlists from "@/pages/Watchlists";
import AlertsPage from "@/pages/AlertsPage";
import Profile from "@/pages/Profile";
import TokenDetail from "@/pages/TokenDetail";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { prefs, updatePrefs } = useUserPreferences();
  const { unreadAlerts } = useMarketData();

  if (!prefs.onboardingComplete) {
    return <Onboarding onComplete={updatePrefs} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell unreadAlerts={unreadAlerts} />}>
          <Route path="/" element={<Radar prefs={prefs} />} />
          <Route path="/opportunities" element={<Opportunities prefs={prefs} />} />
          <Route path="/watchlists" element={<Watchlists />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/profile" element={<Profile prefs={prefs} onUpdatePrefs={updatePrefs} />} />
        </Route>
        <Route path="/token/:id" element={<TokenDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
