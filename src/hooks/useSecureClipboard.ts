// ============================================================================
// File: useSecureClipboard.ts
// Description: Custom React hook for cross-platform secure clipboard copying
//              with automatic 30-second clearing and mobile resume verification.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";

const CLEAR_TIMEOUT_MS = 30000;

export interface SecureClipboardState {
  copiedFieldId: string | null;
  copiedMessage: string | null;
  copyToClipboard: (text: string, fieldId?: string, isSensitive?: boolean) => Promise<boolean>;
}

// ----------------------------------------------------------------------------
// 1. useSecureClipboard
// - Provides safe clipboard copying and guarantees clearing within 30 seconds.
//
// Args:
//   - None.
//
// Return:
//   - SecureClipboardState: Active copied state and copy execution handler.
// ----------------------------------------------------------------------------
export function useSecureClipboard(): SecureClipboardState {
  const [copiedFieldId, setCopiedFieldId] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);

  const sensitiveTargetRef = useRef<{ text: string; timestamp: number } | null>(null);
  const timerRef = useRef<number | null>(null);

  // --------------------------------------------------------------------------
  // Helper: clearClipboardIfMatching
  // - Overwrites clipboard if current system clipboard matches copied target.
  // --------------------------------------------------------------------------
  const clearClipboardIfMatching = useCallback(async () => {
    if (!sensitiveTargetRef.current) return;
    const target = sensitiveTargetRef.current.text;

    try {
      // Step 1. Inspect current system clipboard with permission check
      let currentClipboard = "";
      try {
        currentClipboard = await navigator.clipboard.readText();
      } catch {
        // If readText permission is denied or unsupported, abort auto-clear
        // to avoid blindly overwriting legitimate user data copied in other apps
        console.debug("Clipboard read permission denied; skipping auto-clear.");
        return;
      }

      // Step 2. Overwrite with empty string only if clipboard content matches sensitive target
      if (currentClipboard === target) {
        await navigator.clipboard.writeText("");
        setCopiedMessage("Clipboard cleared for security");
        setTimeout(() => setCopiedMessage(null), 3000);
      }
    } catch (err) {
      console.warn("Failed to clear clipboard automatically:", err);
    } finally {
      sensitiveTargetRef.current = null;
      setCopiedFieldId(null);
    }
  }, []);

  // --------------------------------------------------------------------------
  // Mobile Lifecycle Handler (Android WebView Freeze Trap Fix):
  // - Handles tab switch / window resume after mobile OS backgrounding.
  // --------------------------------------------------------------------------
  useEffect(() => {
    const handleResume = () => {
      if (document.visibilityState === "visible" && sensitiveTargetRef.current) {
        const elapsed = Date.now() - sensitiveTargetRef.current.timestamp;
        if (elapsed >= CLEAR_TIMEOUT_MS) {
          clearClipboardIfMatching();
        }
      }
    };

    document.addEventListener("visibilitychange", handleResume);
    window.addEventListener("focus", handleResume);

    return () => {
      document.removeEventListener("visibilitychange", handleResume);
      window.removeEventListener("focus", handleResume);
    };
  }, [clearClipboardIfMatching]);

  // --------------------------------------------------------------------------
  // Handler: copyToClipboard
  // - Copies sensitive text and arms the desktop timer + mobile resume tracker.
  // --------------------------------------------------------------------------
  const copyToClipboard = useCallback(
    async (text: string, fieldId?: string, isSensitive: boolean = true): Promise<boolean> => {
      if (!text) return false;

      try {
        await navigator.clipboard.writeText(text);

        const id = fieldId || "default";
        setCopiedFieldId(id);
        setCopiedMessage(isSensitive ? "Copied! Will auto-clear in 30s" : "Copied to clipboard");

        if (timerRef.current) {
          window.clearTimeout(timerRef.current);
          timerRef.current = null;
        }

        if (isSensitive) {
          sensitiveTargetRef.current = { text, timestamp: Date.now() };
          timerRef.current = window.setTimeout(() => {
            clearClipboardIfMatching();
          }, CLEAR_TIMEOUT_MS);
          // Auto-hide the floating toast notification after 3.5 seconds
          window.setTimeout(() => {
            setCopiedFieldId(null);
            setCopiedMessage(null);
          }, 3500);
        } else {
          sensitiveTargetRef.current = null;
          timerRef.current = window.setTimeout(() => {
            setCopiedFieldId(null);
            setCopiedMessage(null);
          }, 3000);
        }

        return true;
      } catch (err) {
        console.error("Clipboard copy failed:", err);
        setCopiedMessage("Copy failed (Permission denied)");
        setTimeout(() => setCopiedMessage(null), 3000);
        return false;
      }
    },
    [clearClipboardIfMatching]
  );

  return {
    copiedFieldId,
    copiedMessage,
    copyToClipboard,
  };
}
