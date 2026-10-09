// ============================================================================
// File: useActivityTracker.ts
// Description: Custom React hook listening for user activity and throttling
//              Tauri IPC reset_activity calls to avoid IPC queue congestion.
// ============================================================================

import { useEffect, useRef } from "react";
import { resetActivity } from "../services/tauriApi";

const THROTTLE_INTERVAL_MS = 30000; // 30 seconds throttle to prevent IPC flooding

// ----------------------------------------------------------------------------
// 1. useActivityTracker
// - Attaches global activity listeners and periodically updates vault session.
//
// Args:
//   - enabled: Boolean flag indicating if active tracking is enabled (when unlocked).
//
// Return:
//   - None.
// ----------------------------------------------------------------------------
export function useActivityTracker(enabled: boolean): void {
  const lastPingTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    // ------------------------------------------------------------------------
    // Handler: handleUserActivity
    // - Invokes reset_activity at most once per 30-second window.
    // ------------------------------------------------------------------------
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastPingTimeRef.current >= THROTTLE_INTERVAL_MS) {
        lastPingTimeRef.current = now;
        resetActivity().catch((err) => {
          // Failure to reset activity indicates session already expired or locked
          console.debug("Activity ping skipped or session locked:", err);
        });
      }
    };

    // Attach minimal event listeners capturing diverse input mechanisms
    window.addEventListener("pointerdown", handleUserActivity, { passive: true });
    window.addEventListener("keydown", handleUserActivity, { passive: true });
    window.addEventListener("touchstart", handleUserActivity, { passive: true });
    window.addEventListener("mousemove", handleUserActivity, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      window.removeEventListener("touchstart", handleUserActivity);
      window.removeEventListener("mousemove", handleUserActivity);
    };
  }, [enabled]);
}
