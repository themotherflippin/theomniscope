import { useState } from "react";
import { Plus, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateWatchlist } from "@/hooks/useWatchlists";
import { toast } from "@/hooks/use-toast";

interface AddToWatchlistButtonProps {
  type: "wallet" | "token";
  subject: string;
  chain?: string;
  label?: string;
  size?: "sm" | "icon" | "default";
  variant?: "ghost" | "outline" | "default";
  className?: string;
}

export function AddToWatchlistButton({
  type,
  subject,
  chain = "cronos",
  label = "",
  size = "sm",
  variant = "outline",
  className = "",
}: AddToWatchlistButtonProps) {
  const createMutation = useCreateWatchlist();
  const [added, setAdded] = useState(false);

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await createMutation.mutateAsync({ type, subject, chain, label });
      setAdded(true);
      toast({ title: `Added to watchlist` });
      setTimeout(() => setAdded(false), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add";
      if (msg.includes("already")) {
        toast({ title: "Already in watchlist" });
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      } else {
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleAdd}
      disabled={createMutation.isPending || added}
      className={`gap-1 ${className}`}
    >
      {createMutation.isPending ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : added ? (
        <Check className="w-3 h-3 text-success" />
      ) : (
        <Plus className="w-3 h-3" />
      )}
      {size !== "icon" && (added ? "Added" : "Watch")}
    </Button>
  );
}
