import { useState, useEffect, useCallback } from "react";
import { useWeb3ModalAccount } from "@web3modal/ethers/react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "oracle_session_token";
const DEVICE_KEY = "oracle_device_id";

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

export type AccessType = "none" | "nft" | "subscription" | "credits" | "invitation";

export interface AccessStatus {
  hasAccess: boolean;
  accessType: AccessType;
  credits: number;
  nftVerified: boolean;
  walletAddress: string | null;
  subscriptionStatus: string | null;
}

export function useAccessGateway() {
  const { address, isConnected, chainId } = useWeb3ModalAccount();

  const [status, setStatus] = useState<AccessStatus>({
    hasAccess: false,
    accessType: "none",
    credits: 0,
    nftVerified: false,
    walletAddress: null,
    subscriptionStatus: null,
  });
  const [loading, setLoading] = useState(true);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check existing session on mount
  const checkStatus = useCallback(async () => {
    try {
      const sessionToken = getSessionToken();
      const deviceId = getDeviceId();

      const { data, error: fnError } = await supabase.functions.invoke("access-user-status", {
        body: { session_token: sessionToken, device_id: deviceId },
      });

      if (fnError) throw fnError;

      if (data?.has_access) {
        setStatus({
          hasAccess: true,
          accessType: data.access_type || "none",
          credits: data.credits || 0,
          nftVerified: data.nft_verified || false,
          walletAddress: data.wallet_address || null,
          subscriptionStatus: data.subscription_status || null,
        });
      } else {
        setStatus((prev) => ({ ...prev, hasAccess: false }));
      }
    } catch (err) {
      console.error("[AccessGateway] Status check failed:", err);
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

  // When WalletConnect connects, authenticate with backend
  useEffect(() => {
    if (isConnected && address && !status.walletAddress) {
      authenticateWallet(address, chainId || 1);
    }
  }, [isConnected, address]);

  const authenticateWallet = useCallback(async (walletAddress: string, chain: number) => {
    setWalletConnecting(true);
    setError(null);

    try {
      const deviceId = getDeviceId();

      // No signature required — just connect the wallet address
      const { data, error: fnError } = await supabase.functions.invoke("access-wallet-auth", {
        body: {
          wallet_address: walletAddress,
          device_id: deviceId,
          chain_id: chain,
        },
      });

      if (fnError) throw fnError;

      if (data?.session_token) {
        setSessionToken(data.session_token);
      }

      setStatus({
        hasAccess: data?.has_access || false,
        accessType: data?.access_type || "none",
        credits: data?.credits || 0,
        nftVerified: data?.nft_verified || false,
        walletAddress: data?.wallet_address || walletAddress,
        subscriptionStatus: null,
      });

      if (!data?.has_access) {
        setError(null);
      }
    } catch (err: any) {
      setError(err?.message || "Wallet connection failed.");
    } finally {
      setWalletConnecting(false);
    }
  }, []);

  const startCheckout = useCallback(async () => {
    setCheckoutLoading(true);
    setError(null);

    try {
      const deviceId = getDeviceId();

      const { data, error: fnError } = await supabase.functions.invoke("access-create-checkout", {
        body: {
          device_id: deviceId,
          wallet_address: status.walletAddress,
        },
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
  }, [status.walletAddress]);

  // Legacy invitation code support
  const submitInvitationCode = useCallback(async (code: string) => {
    setError(null);
    try {
      const deviceId = getDeviceId();
      const trimmed = code.trim().toUpperCase();

      const { data } = await supabase
        .from("invitation_codes")
        .select("*")
        .eq("code", trimmed)
        .limit(1);

      if (!data || data.length === 0) {
        setError("Invalid code.");
        return false;
      }

      const invitation = data[0];

      if (invitation.is_used && invitation.device_id === deviceId) {
        // Already used by this device — grant access
      } else if (invitation.is_used) {
        setError("Code already used.");
        return false;
      } else {
        await supabase
          .from("invitation_codes")
          .update({ is_used: true, device_id: deviceId, used_at: new Date().toISOString() })
          .eq("id", invitation.id);
      }

      const { data: existing } = await supabase
        .from("user_access")
        .select("id")
        .eq("device_id", deviceId)
        .limit(1);

      const sessionToken =
        Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, "0")).join("");
      const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      if (existing && existing.length > 0) {
        await supabase
          .from("user_access")
          .update({
            access_type: "invitation",
            session_token: sessionToken,
            session_expires_at: expiry,
          })
          .eq("id", existing[0].id);
      } else {
        await supabase.from("user_access").insert({
          device_id: deviceId,
          access_type: "invitation",
          session_token: sessionToken,
          session_expires_at: expiry,
        });
      }

      setSessionToken(sessionToken);

      await supabase.from("access_events").insert({
        device_id: deviceId,
        event_type: "invitation_code",
        metadata: { code: trimmed },
      });

      setStatus((prev) => ({ ...prev, hasAccess: true, accessType: "invitation" }));
      return true;
    } catch (err: any) {
      setError(err?.message || "Error validating code.");
      return false;
    }
  }, []);

  const grantAccess = useCallback(() => {
    setStatus((prev) => ({ ...prev, hasAccess: true }));
  }, []);

  return {
    status,
    loading,
    walletConnecting,
    checkoutLoading,
    error,
    startCheckout,
    submitInvitationCode,
    grantAccess,
    checkStatus,
    isWalletConnected: isConnected,
    walletAddress: address,
  };
}
