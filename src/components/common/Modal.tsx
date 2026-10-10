// ============================================================================
// File: Modal.tsx
// Description: Accessible modal dialog overlay with glassmorphism backdrop blur
//              and refined monochromatic dark/light styling.
// ============================================================================

import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

// ----------------------------------------------------------------------------
// 1. Modal
// - Accessible modal dialog overlay with glass surface elevation.
//
// Args:
//   - isOpen: Boolean visibility trigger.
//   - onClose: Callback triggered on close button, escape key or backdrop click.
//   - title: Header modal title.
//   - children: Modal interior body.
//   - maxWidth: Horizontal boundary constrainer.
//
// Return:
//   - JSX.Element | null: Rendered modal tree or null when closed.
// ----------------------------------------------------------------------------
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full ${maxWidthClasses} bg-zinc-900/90 light:bg-white/95 border border-zinc-800 light:border-zinc-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-left transition-all duration-200 backdrop-blur-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 light:border-zinc-200/80 bg-zinc-900/50 light:bg-zinc-50/50">
          <h3 className="text-sm font-semibold tracking-wide text-zinc-100 light:text-zinc-900">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            title="Close dialog"
            className="p-1.5 rounded-xl border border-transparent text-zinc-400 hover:text-zinc-100 dark:hover:text-zinc-100 light:text-zinc-500 light:hover:text-zinc-950 hover:bg-zinc-800/80 dark:hover:bg-zinc-800/80 light:hover:bg-white light:hover:border-zinc-300 light:hover:shadow-xs transition-all duration-150 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
