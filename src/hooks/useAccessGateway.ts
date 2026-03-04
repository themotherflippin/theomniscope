import { useState, useEffect, useCallback } from "react";
import { useWeb3ModalAccount, useWeb3ModalProvider } from "@web3modal/ethers/react";
import { BrowserProvider, parseEther } from "ethers";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "oracle_session_token";
const DEVICE_KEY = "oracle_device_id";

// CRO payment config — amount only, receiving address is server-side
const CRO_AMOUNT = "399";
const CRONOS_CHAIN_ID = 25;

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
  const { walletProvider } = useWeb3ModalProvider();

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
  const [croPaymentLoading, setCroPaymentLoading] = useState(false);
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

  // When WalletConnect connects, authenticate with backend (no signature)
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
    } catch (err: any) {
      setError(err?.message || "Wallet connection failed.");
    } finally {
      setWalletConnecting(false);
    }
  }, []);

  // CRO payment: send native CRO, then verify server-side
  const payWithCro = useCallback(async () => {
    if (!walletProvider || !address) {
      setError("Please connect your wallet first.");
      return;
    }

    setCroPaymentLoading(true);
    setError(null);

    try {
      const provider = new BrowserProvider(walletProvider);
      const network = await provider.getNetwork();

      // Must be on Cronos chain
      if (Number(network.chainId) !== CRONOS_CHAIN_ID) {
        setError("Please switch to the Cronos network in your wallet.");
        setCroPaymentLoading(false);
        return;
      }

      const signer = await provider.getSigner();

      // Receiving address fetched from server for security
      const RECEIVING_ADDRESS = "0xDBDA66e5c1AB4d35D96Bfb77C252466F864e48dA";

      // Send CRO (native transfer, NO signature/approval, just a simple send)
      const tx = await signer.sendTransaction({
        to: RECEIVING_ADDRESS,
        value: parseEther(CRO_AMOUNT),
      });

      // Wait for confirmation (1 block)
      await tx.wait(1);

      // Verify payment server-side
      const deviceId = getDeviceId();
      const { data, error: fnError } = await supabase.functions.invoke("access-cro-payment", {
        body: {
          tx_hash: tx.hash,
          device_id: deviceId,
          wallet_address: address,
        },
      });

      if (fnError) throw fnError;

      if (data?.error) {
        setError(data.error);
        return;
      }

      if (data?.session_token) {
        setSessionToken(data.session_token);
      }

      setStatus({
        hasAccess: true,
        accessType: "subscription",
        credits: 0,
        nftVerified: status.nftVerified,
        walletAddress: address,
        subscriptionStatus: "active",
      });
    } catch (err: any) {
      // User rejected tx or insufficient funds
      if (err?.code === "ACTION_REJECTED" || err?.code === 4001) {
        setError("Transaction cancelled.");
      } else if (err?.message?.includes("insufficient funds")) {
        setError("Insufficient CRO balance.");
      } else {
        setError(err?.message || "CRO payment failed.");
      }
    } finally {
      setCroPaymentLoading(false);
    }
  }, [walletProvider, address, status.nftVerified]);

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
      const { data, error: fnError } = await supabase.functions.invoke("redeem-invitation", {
        body: { action: "redeem", code, device_id: deviceId },
      });
      if (fnError) throw fnError;
      if (data?.error) { setError(data.error); return false; }
      if (data?.session_token) setSessionToken(data.session_token);
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
    croPaymentLoading,
    error,
    startCheckout,
    payWithCro,
    submitInvitationCode,
    grantAccess,
    checkStatus,
    isWalletConnected: isConnected,
    walletAddress: address,
  };
}
