// ============================================================================
// File: useVault.ts
// Description: Custom React hook managing vault lifecycle state (status, unlock,
//              lock, initialization) and periodic sync with backend.
// ============================================================================

import { useCallback, useEffect, useState } from "react";
import { getVaultStatus, initVault, lockVault, unlockVault } from "../services/tauriApi";
import { VaultStatus } from "../types";

export interface VaultHookState {
  status: VaultStatus | null;
  isLoading: boolean;
  error: string | null;
  initialize: (masterPassword: string) => Promise<boolean>;
  unlock: (masterPassword: string) => Promise<boolean>;
  lock: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

// ----------------------------------------------------------------------------
// 1. useVault
// - Manages global vault lifecycle and coordinates with backend session status.
//
// Args:
//   - None.
//
// Return:
//   - VaultHookState: Lifecycle flags, error reporting, and dispatch actions.
// ----------------------------------------------------------------------------
export function useVault(): VaultHookState {
  const [status, setStatus] = useState<VaultStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // Handler: refreshStatus
  // - Fetches latest initialization and lock status from backend.
  // --------------------------------------------------------------------------
  const refreshStatus = useCallback(async () => {
    try {
      const s = await getVaultStatus();
      setStatus(s);
      setError(null);
    } catch (err: unknown) {
      console.error("Failed to query vault status:", err);
      const msg = typeof err === "object" && err !== null && "message" in err 
        ? String((err as { message: unknown }).message)
        : String(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Periodic polling only when unlocked to detect auto-lock expiration
  useEffect(() => {
    if (!status?.is_unlocked) return;

    const interval = setInterval(() => {
      getVaultStatus()
        .then((s) => {
          if (!s.is_unlocked) {
            setStatus((prev) => (prev ? { ...prev, is_unlocked: false } : s));
          }
        })
        .catch(() => {});
    }, 10000);

    return () => clearInterval(interval);
  }, [status?.is_unlocked]);

  // --------------------------------------------------------------------------
  // Handler: initialize
  // - Sets up new vault and derives master key on Argon2id background thread.
  // --------------------------------------------------------------------------
  const initialize = useCallback(
    async (masterPassword: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await initVault(masterPassword);
        await refreshStatus();
        return true;
      } catch (err: unknown) {
        console.error("Vault initialization failed:", err);
        const msg = typeof err === "object" && err !== null && "message" in err 
          ? String((err as { message: unknown }).message)
          : String(err);
        setError(msg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshStatus]
  );

  // --------------------------------------------------------------------------
  // Handler: unlock
  // - Validates master password and establishes memory session.
  // --------------------------------------------------------------------------
  const unlock = useCallback(
    async (masterPassword: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await unlockVault(masterPassword);
        await refreshStatus();
        return true;
      } catch (err: unknown) {
        console.error("Vault unlock failed:", err);
        const msg = typeof err === "object" && err !== null && "message" in err 
          ? String((err as { message: unknown }).message)
          : "Invalid Master Password";
        setError(msg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshStatus]
  );

  // --------------------------------------------------------------------------
  // Handler: lock
  // - Flushes active session and reverts UI to lock screen.
  // --------------------------------------------------------------------------
  const lock = useCallback(async () => {
    setIsLoading(true);
    try {
      await lockVault();
    } catch (err) {
      console.warn("Vault lock IPC error:", err);
    } finally {
      setStatus((prev) => (prev ? { ...prev, is_unlocked: false } : null));
      setIsLoading(false);
    }
  }, []);

  return {
    status,
    isLoading,
    error,
    initialize,
    unlock,
    lock,
    refreshStatus,
  };
}
