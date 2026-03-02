import { useNavigate } from "react-router-dom";
import {
  Eye, BookOpen, Network, Zap,
  List, BarChart3,
} from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { motion } from "framer-motion";

interface MoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const hubItems = [
  { icon: Eye, label: "Watchlists", path: "/watchlists", color: "from-blue-500/20 to-blue-600/5", iconColor: "text-blue-500" },
  { icon: Zap, label: "Alert Rules", path: "/alert-rules", color: "from-amber-500/20 to-amber-600/5", iconColor: "text-amber-500" },
  { icon: List, label: "Radar", path: "/radar", color: "from-emerald-500/20 to-emerald-600/5", iconColor: "text-emerald-500" },
  { icon: Network, label: "Clusters", path: "/intel", color: "from-violet-500/20 to-violet-600/5", iconColor: "text-violet-500" },
  { icon: BarChart3, label: "Opportunities", path: "/opportunities", color: "from-cyan-500/20 to-cyan-600/5", iconColor: "text-cyan-500" },
  { icon: BookOpen, label: "New Listings", path: "/new-listings", color: "from-rose-500/20 to-rose-600/5", iconColor: "text-rose-500" },
];

export function MoreSheet({ open, onOpenChange }: MoreSheetProps) {
  const navigate = useNavigate();

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh] px-4 pb-6">
        <SheetHeader className="pb-3">
          <SheetTitle className="text-sm font-display tracking-wide">Hub</SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-3 gap-2">
          {hubItems.map((item, idx) => (
            <motion.button
              key={item.path}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.03, type: "spring", stiffness: 400, damping: 25 }}
              onClick={() => go(item.path)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/40 bg-gradient-to-b ${item.color} hover:scale-[1.03] active:scale-[0.97] transition-transform`}
            >
              <div className="w-9 h-9 rounded-xl bg-background/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
                <item.icon className={`w-4.5 h-4.5 ${item.iconColor}`} />
              </div>
              <p className="text-[11px] font-medium text-foreground leading-tight">{item.label}</p>
            </motion.button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
