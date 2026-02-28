import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Wallet, Coins, Hash, FolderOpen, X, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

type SearchType = "wallet" | "token" | "tx" | "case" | "unknown";

function detectType(q: string): SearchType {
  const trimmed = q.trim().toLowerCase();
  if (/^0x[a-f0-9]{64}$/i.test(trimmed)) return "tx";
  if (/^0x[a-f0-9]{40}$/i.test(trimmed)) return "wallet"; // could be token too
  if (/^[a-f0-9-]{36}$/i.test(trimmed)) return "case";
  return "unknown";
}

const STORAGE_KEY = "oracle_recent_searches";

function getRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]").slice(0, 5);
  } catch {
    return [];
  }
}

function saveRecent(q: string) {
  const list = getRecent().filter((s) => s !== q);
  list.unshift(q);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 5)));
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const recents = useMemo(() => getRecent(), [focused]);
  const type = query.trim().length > 2 ? detectType(query) : "unknown";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const go = (target: string, q?: string) => {
    const value = q ?? query.trim();
    if (!value) return;
    saveRecent(value);
    setQuery("");
    setFocused(false);
    navigate(target);
  };

  const actions = useMemo(() => {
    const q = query.trim();
    if (!q || q.length < 3) return [];
    const items: { label: string; icon: typeof Wallet; action: () => void }[] = [];

    if (type === "wallet" || type === "unknown") {
      items.push({
        label: `Investigate wallet: ${q.slice(0, 10)}…`,
        icon: Wallet,
        action: () => go(`/lookup?q=${encodeURIComponent(q)}`, q),
      });
    }
    if (type === "wallet" || type === "token" || type === "unknown") {
      items.push({
        label: `Token Intel: ${q.slice(0, 10)}…`,
        icon: Coins,
        action: () => go(`/intel/${encodeURIComponent(q)}`, q),
      });
    }
    if (type === "tx") {
      items.push({
        label: `View transaction: ${q.slice(0, 10)}…`,
        icon: Hash,
        action: () => go(`/lookup?q=${encodeURIComponent(q)}`, q),
      });
    }
    if (type === "case") {
      items.push({
        label: `Open case: ${q.slice(0, 10)}…`,
        icon: FolderOpen,
        action: () => go(`/cases/${q}`, q),
      });
    }
    return items;
  }, [query, type]);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && actions.length > 0) actions[0].action();
          }}
          placeholder="Search wallet, token, tx…"
          className="pl-8 pr-8 h-8 text-xs bg-muted/50 border-border/50"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2"
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {focused && (actions.length > 0 || recents.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden"
          >
            {actions.length > 0 && (
              <div className="p-1.5">
                {actions.map((a, i) => (
                  <button
                    key={i}
                    onClick={a.action}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs hover:bg-accent/50 transition-colors"
                  >
                    <a.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{a.label}</span>
                  </button>
                ))}
              </div>
            )}

            {actions.length === 0 && recents.length > 0 && (
              <div className="p-1.5">
                <p className="text-[10px] text-muted-foreground px-2.5 py-1">Recent</p>
                {recents.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setQuery(r);
                      const t = detectType(r);
                      if (t === "case") go(`/cases/${r}`, r);
                      else go(`/intel/${encodeURIComponent(r)}`, r);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs hover:bg-accent/50 transition-colors"
                  >
                    <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="font-mono truncate text-muted-foreground">{r}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
