// ============================================================================
// File: Toast.tsx
// Description: Lightweight notification toast for clipboard & operational feedback.
// ============================================================================

import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

export interface ToastProps {
  message: string | null;
  type?: "info" | "success" | "error";
}

// ----------------------------------------------------------------------------
// 1. Toast
// - Renders temporary floating banner at bottom-center of viewport.
//
// Args:
//   - message: String content to display or null when idle.
//   - type: Semantic palette icon style (info, success, error).
//
// Return:
//   - JSX.Element | null: Rendered toast overlay.
// ----------------------------------------------------------------------------
export const Toast: React.FC<ToastProps> = ({ message, type = "info" }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-zinc-800/95 border border-zinc-700/80 shadow-xl backdrop-blur-md text-sm text-zinc-100 animate-in fade-in slide-in-from-bottom-3 duration-200">
      {type === "error" ? (
        <AlertCircle size={16} className="text-rose-400 shrink-0" />
      ) : (
        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
};
