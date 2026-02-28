import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye, Settings, Shield, BookOpen, Network, Zap,
  List, ShieldCheck, BarChart3
} from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_CODE = "JPKW9ZVZ";

interface MoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MoreSheet({ open, onOpenChange }: MoreSheetProps) {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const deviceId = localStorage.getItem("oracle_device_id");
    if (!deviceId) return;
    supabase
      .from("invitation_codes")
      .select("code")
      .eq("device_id", deviceId)
      .eq("is_used", true)
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]?.code === ADMIN_CODE) setIsAdmin(true);
      });
  }, []);

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const items = [
    { icon: Eye, label: "Watchlists", path: "/watchlists" },
    { icon: Zap, label: "Alert Rules", path: "/alert-rules" },
    { icon: Network, label: "Clusters", path: "/intel" },
    { icon: BarChart3, label: "Opportunities", path: "/opportunities" },
    { icon: BookOpen, label: "New Listings", path: "/new-listings" },
    { icon: List, label: "Radar", path: "/radar" },
    { icon: Settings, label: "Settings", path: "/profile" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh]">
        <SheetHeader>
          <SheetTitle className="text-sm font-display">More</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-3 gap-2 py-4">
          {items.map((item) => (
            <button
              key={item.path}
              onClick={() => go(item.path)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-accent/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-muted/80 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-foreground/70" />
              </div>
              <span className="text-[10px] font-medium text-foreground/80">{item.label}</span>
            </button>
          ))}

          {isAdmin && (
            <button
              onClick={() => go("/admin")}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-accent/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <span className="text-[10px] font-medium text-primary">Admin</span>
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
