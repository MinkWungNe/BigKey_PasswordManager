// ============================================================================
// File: Toast.tsx
// Description: Refined floating notification toast with glassmorphism styling.
// ============================================================================

import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

export interface ToastProps {
  message: string | null;
  type?: "info" | "success" | "error";
}

// ----------------------------------------------------------------------------
// 1. Toast
// - Renders temporary floating banner at bottom-center with glassmorphism surface.
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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-zinc-900/90 light:bg-white/95 border border-zinc-700/80 light:border-zinc-300 shadow-2xl backdrop-blur-xl text-xs font-medium text-zinc-100 light:text-zinc-900 animate-in fade-in slide-in-from-bottom-3 duration-200">
      {type === "error" ? (
        <AlertCircle size={15} className="text-rose-400 shrink-0" />
      ) : (
        <CheckCircle2 size={15} className="text-zinc-300 light:text-zinc-800 shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
};
