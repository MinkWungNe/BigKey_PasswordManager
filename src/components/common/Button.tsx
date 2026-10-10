// ============================================================================
// File: Button.tsx
// Description: Reusable standard button component with Neutral Monochromatic
//              styling, subtle glassmorphism, and responsive active states.
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
// - Accessible interactive button with Neutral Monochromatic styling.
//
// Args:
//   - variant: Style preset (primary, secondary, danger, ghost, outline).
//   - size: Padding and font scale (sm, md, lg).
//   - isLoading: Flag displaying spinner and disabling click.
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
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 dark:focus-visible:ring-offset-zinc-950 light:focus-visible:ring-offset-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer select-none active:scale-[0.98]";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2.5",
  }[size];

  const variantClasses = {
    // Primary: High contrast monochrome (White on Dark, Black on Light)
    primary:
      "bg-zinc-100 hover:bg-white text-zinc-950 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 light:bg-zinc-900 light:hover:bg-zinc-800 light:text-white shadow-xs font-semibold",
    // Secondary: Subdued glass border button
    secondary:
      "bg-zinc-900/60 dark:bg-zinc-900/60 hover:bg-zinc-900/90 dark:hover:bg-zinc-900/90 text-zinc-200 dark:text-zinc-200 border border-zinc-700/80 dark:border-zinc-700/80 hover:border-zinc-600 light:bg-white/80 light:hover:bg-white light:text-zinc-900 light:border-zinc-300 light:hover:border-zinc-300 shadow-xs backdrop-blur-xs",
    // Danger: Precision crimson
    danger:
      "bg-rose-600 hover:bg-rose-500 text-white shadow-xs font-semibold focus:ring-rose-500",
    // Ghost: Subtle highlight
    ghost:
      "bg-transparent hover:bg-zinc-900/60 dark:hover:bg-zinc-900/60 text-zinc-400 dark:text-zinc-400 hover:text-zinc-100 dark:hover:text-zinc-100 light:text-zinc-600 light:hover:text-zinc-950 light:hover:bg-white/80 light:hover:border-zinc-300/60 border border-transparent",
    // Outline: Hairline border
    outline:
      "bg-transparent hover:bg-zinc-900/60 dark:hover:bg-zinc-900/60 text-zinc-300 dark:text-zinc-300 border border-zinc-700/70 dark:border-zinc-700/70 hover:border-zinc-500 light:border-zinc-300 light:text-zinc-700 light:hover:bg-white/80 light:hover:border-zinc-300/80",
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
