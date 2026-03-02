import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useWeb3ModalAccount, useWeb3ModalProvider } from "@web3modal/ethers/react";
import { BrowserProvider } from "ethers";
import { supabase } from "@/integrations/supabase/client";

const DEVICE_KEY = "oracle_device_id";
const SESSION_KEY = "oracle_session_token";

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

function getSessionToken(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

function setSessionToken(token: string) {
  localStorage.setItem(SESSION_KEY, token);
}

export type PremiumSource = "none" | "subscription" | "nft" | "invitation";

export interface PremiumState {
  isPremium: boolean;
  source: PremiumSource;
  walletAddress: string | null;
  nftVerified: boolean;
  subscriptionStatus: string | null;
  subscriptionExpiresAt: string | null;
}

interface PremiumContextValue {
  premium: PremiumState;
  loading: boolean;
  walletConnecting: boolean;
  checkoutLoading: boolean;
  error: string | null;
  startCheckout: () => Promise<void>;
  submitVoucher: (code: string) => Promise<boolean>;
  checkStatus: () => Promise<void>;
  isWalletConnected: boolean;
  walletAddress: string | undefined;
}

const PremiumContext = createContext<PremiumContextValue | null>(null);

export function PremiumProvider({ children }: { children: ReactNode }) {
  const { address, isConnected, chainId } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();

  const [premium, setPremium] = useState<PremiumState>({
    isPremium: false,
    source: "none",
    walletAddress: null,
    nftVerified: false,
    subscriptionStatus: null,
    subscriptionExpiresAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const sessionToken = getSessionToken();
      const deviceId = getDeviceId();

      const { data, error: fnError } = await supabase.functions.invoke("access-user-status", {
        body: { session_token: sessionToken, device_id: deviceId },
      });

      if (fnError) throw fnError;

      if (data?.has_access) {
        const src = data.access_type as PremiumSource;
        setPremium({
          isPremium: true,
          source: ["subscription", "nft", "invitation"].includes(src) ? src : "none",
          walletAddress: data.wallet_address || null,
          nftVerified: data.nft_verified || false,
          subscriptionStatus: data.subscription_status || null,
          subscriptionExpiresAt: data.subscription_expires_at || null,
        });
      } else {
        setPremium((prev) => ({ ...prev, isPremium: false, source: "none" }));
      }
    } catch (err) {
      console.error("[Premium] Status check failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(checkStatus, 3000);
    }
  }, [checkStatus]);

  // Wallet auth on connect
  useEffect(() => {
    if (isConnected && address && walletProvider && !premium.walletAddress) {
      authenticateWallet(address, chainId || 1);
    }
  }, [isConnected, address, walletProvider]);

  const authenticateWallet = useCallback(
    async (walletAddress: string, chain: number) => {
      setWalletConnecting(true);
      setError(null);
      try {
        if (!walletProvider) {
          setError("Wallet provider not available.");
          return;
        }
        const provider = new BrowserProvider(walletProvider);
        const signer = await provider.getSigner();
        const deviceId = getDeviceId();
        const message = `Sign this message to access Oracle System.\n\nDevice: ${deviceId}\nTimestamp: ${Date.now()}`;
        const signature = await signer.signMessage(message);

        const { data, error: fnError } = await supabase.functions.invoke("access-wallet-auth", {
          body: { wallet_address: walletAddress, signature, message, device_id: deviceId, chain_id: chain },
        });

        if (fnError) throw fnError;
        if (data?.session_token) setSessionToken(data.session_token);

        const hasPremium = data?.has_access || false;
        const src = data?.access_type as PremiumSource;
        setPremium({
          isPremium: hasPremium,
          source: hasPremium && ["subscription", "nft", "invitation"].includes(src) ? src : "none",
          walletAddress: data?.wallet_address || walletAddress,
          nftVerified: data?.nft_verified || false,
          subscriptionStatus: null,
          subscriptionExpiresAt: null,
        });
      } catch (err: any) {
        if (err?.code === "ACTION_REJECTED" || err?.code === 4001) {
          setError("Signature rejected.");
        } else {
          setError(err?.message || "Wallet authentication failed.");
        }
      } finally {
        setWalletConnecting(false);
      }
    },
    [walletProvider]
  );

  const startCheckout = useCallback(async () => {
    setCheckoutLoading(true);
    setError(null);
    try {
      const deviceId = getDeviceId();
      const { data, error: fnError } = await supabase.functions.invoke("access-create-checkout", {
        body: { device_id: deviceId, wallet_address: premium.walletAddress },
      });
      if (fnError) throw fnError;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to start checkout.");
    } finally {
      setCheckoutLoading(false);
    }
  }, [premium.walletAddress]);

  const submitVoucher = useCallback(async (code: string) => {
    setError(null);
    try {
      const deviceId = getDeviceId();
      const trimmed = code.trim().toUpperCase();
      const { data } = await supabase.from("invitation_codes").select("*").eq("code", trimmed).limit(1);
      if (!data || data.length === 0) { setError("Invalid code."); return false; }
      const invitation = data[0];
      if (invitation.is_used && invitation.device_id === deviceId) {
        // Already used by this device
      } else if (invitation.is_used) {
        setError("Code already used.");
        return false;
      } else {
        await supabase.from("invitation_codes").update({ is_used: true, device_id: deviceId, used_at: new Date().toISOString() }).eq("id", invitation.id);
      }
      const { data: existing } = await supabase.from("user_access").select("id").eq("device_id", deviceId).limit(1);
      const sessionToken = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, "0")).join("");
      const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      if (existing && existing.length > 0) {
        await supabase.from("user_access").update({ access_type: "invitation", session_token: sessionToken, session_expires_at: expiry }).eq("id", existing[0].id);
      } else {
        await supabase.from("user_access").insert({ device_id: deviceId, access_type: "invitation", session_token: sessionToken, session_expires_at: expiry });
      }
      setSessionToken(sessionToken);
      await supabase.from("access_events").insert({ device_id: deviceId, event_type: "invitation_code", metadata: { code: trimmed } });
      setPremium((prev) => ({ ...prev, isPremium: true, source: "invitation" }));
      return true;
    } catch (err: any) {
      setError(err?.message || "Error validating code.");
      return false;
    }
  }, []);

  return (
    <PremiumContext.Provider
      value={{
        premium,
        loading,
        walletConnecting,
        checkoutLoading,
        error,
        startCheckout,
        submitVoucher,
        checkStatus,
        isWalletConnected: isConnected,
        walletAddress: address,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error("usePremium must be used within PremiumProvider");
  return ctx;
}
