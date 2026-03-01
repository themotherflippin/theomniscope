import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye, Shield, BookOpen, Network, Zap,
  List, ShieldCheck, BarChart3
} from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { useAdminStatus } from "@/hooks/useAdminStatus";

interface MoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const hubItems = [
  { icon: Eye, label: "Watchlists", path: "/watchlists", desc: "Track wallets & tokens", gradient: "from-blue-500/20 to-cyan-500/10", accent: "text-blue-400", iconBg: "bg-blue-500/20" },
  { icon: Zap, label: "Alert Rules", path: "/alert-rules", desc: "Custom notifications", gradient: "from-amber-500/20 to-orange-500/10", accent: "text-amber-400", iconBg: "bg-amber-500/20" },
  { icon: List, label: "Radar", path: "/radar", desc: "Live market feed", gradient: "from-emerald-500/20 to-green-500/10", accent: "text-emerald-400", iconBg: "bg-emerald-500/20" },
  { icon: Network, label: "Clusters", path: "/intel", desc: "On-chain intelligence", gradient: "from-purple-500/20 to-violet-500/10", accent: "text-purple-400", iconBg: "bg-purple-500/20" },
  { icon: BarChart3, label: "Opportunities", path: "/opportunities", desc: "Scored setups", gradient: "from-cyan-500/20 to-teal-500/10", accent: "text-cyan-400", iconBg: "bg-cyan-500/20" },
  { icon: BookOpen, label: "New Listings", path: "/new-listings", desc: "Fresh tokens", gradient: "from-rose-500/20 to-pink-500/10", accent: "text-rose-400", iconBg: "bg-rose-500/20" },
];

export function MoreSheet({ open, onOpenChange }: MoreSheetProps) {
  const navigate = useNavigate();
  const isAdmin = useAdminStatus();

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[75vh] px-4 pb-6">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-sm font-display tracking-wide flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Hub
          </SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-2 gap-2.5">
          {hubItems.map((item) => (
            <button
              key={item.path}
              onClick={() => go(item.path)}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/[0.06] bg-gradient-to-br ${item.gradient} backdrop-blur-md hover:scale-[1.02] active:scale-[0.97] transition-all duration-200 text-center overflow-hidden shadow-lg shadow-black/10`}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
              <div className={`w-11 h-11 rounded-xl ${item.iconBg} flex items-center justify-center`}>
                <item.icon className={`w-5 h-5 ${item.accent}`} />
              </div>
              <p className="text-xs font-semibold text-foreground">{item.label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{item.desc}</p>
            </button>
          ))}

          {isAdmin && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2 px-1">
                Admin
              </p>
              <button
                onClick={() => go("/admin")}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/10 transition-colors text-left w-full"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-primary">Admin Panel</p>
                  <p className="text-[10px] text-muted-foreground">Manage codes & users</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
