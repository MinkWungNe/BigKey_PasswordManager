// ============================================================================
// File: Input.tsx
// Description: Secure input field supporting conceal/reveal toggling and
//              Neutral Monochromatic Glassmorphism styling.
// ============================================================================

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  isPassword?: boolean;
}

// ----------------------------------------------------------------------------
// 1. Input
// - Text input element with optional password reveal toggle and glass hairline styling.
//
// Args:
//   - label: Field title placed above the input box.
//   - error: Optional error string triggering red outline.
//   - isPassword: Flag enabling visibility toggle eye button.
//
// Return:
//   - JSX.Element: Styled input container.
// ----------------------------------------------------------------------------
export const Input: React.FC<InputProps> = ({
  label,
  error,
  isPassword = false,
  type = "text",
  className = "",
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const effectiveType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1.5 w-full text-left">
      {label && (
        <label className="text-xs font-medium text-zinc-400 light:text-zinc-600 select-none tracking-wide">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          type={effectiveType}
          className={`w-full bg-zinc-900/60 light:bg-white/90 border ${
            error
              ? "border-rose-500 focus:border-rose-400"
              : "border-zinc-800 light:border-zinc-300 focus:border-zinc-400 light:focus:border-zinc-800"
          } rounded-xl px-3.5 py-2 text-sm text-zinc-100 light:text-zinc-900 placeholder-zinc-500 light:placeholder-zinc-400 focus:outline-none focus:ring-1 ${
            error ? "focus:ring-rose-500" : "focus:ring-zinc-400 light:focus:ring-zinc-800"
          } transition-all duration-150 backdrop-blur-xs ${isPassword ? "pr-10" : ""} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2.5 p-1 text-zinc-400 hover:text-zinc-200 light:text-zinc-500 light:hover:text-zinc-800 focus:outline-none cursor-pointer transition-colors"
            title={showPassword ? "Hide value" : "Show value"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <span className="text-xs text-rose-400 select-none">{error}</span>}
    </div>
  );
};
