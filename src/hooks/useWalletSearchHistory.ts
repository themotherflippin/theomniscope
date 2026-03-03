import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "wallet_search_history";
const MAX_HISTORY = 12;

export interface WalletHistoryEntry {
  address: string;
  lastUsed: number;
}

export function useWalletSearchHistory() {
  const [history, setHistory] = useState<WalletHistoryEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  const addToHistory = useCallback((address: string) => {
    setHistory((prev) => {
      const filtered = prev.filter((e) => e.address.toLowerCase() !== address.toLowerCase());
      const next = [{ address, lastUsed: Date.now() }, ...filtered].slice(0, MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFromHistory = useCallback((address: string) => {
    setHistory((prev) => {
      const next = prev.filter((e) => e.address.toLowerCase() !== address.toLowerCase());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { history, addToHistory, removeFromHistory, clearHistory };
}
