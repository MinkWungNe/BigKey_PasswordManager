// ============================================================================
// File: Button.tsx
// Description: Reusable standard button component with variant styling.
// ============================================================================

import React from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

// ----------------------------------------------------------------------------
// 1. Button
// - Renders accessible interactive button with variant styling.
//
// Args:
//   - variant: Visual style palette (primary, secondary, danger, ghost, outline).
//   - size: Padding and font scale (sm, md, lg).
//   - isLoading: Flag disabling button and displaying loading spinner.
//   - children: Embedded button content.
//
// Return:
//   - JSX.Element: Styled HTML button element.
// ----------------------------------------------------------------------------
export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  children,
  className = "",
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2.5",
  }[size];

  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white focus:ring-blue-500 shadow-sm",
    secondary: "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 focus:ring-zinc-500 border border-zinc-700",
    danger: "bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-500 shadow-sm",
    ghost: "bg-transparent hover:bg-zinc-800/60 text-zinc-300 focus:ring-zinc-500",
    outline: "bg-transparent hover:bg-zinc-800 text-zinc-300 border border-zinc-700 focus:ring-zinc-500",
  }[variant];

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </button>
  );
};
