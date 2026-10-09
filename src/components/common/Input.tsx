// ============================================================================
// File: Input.tsx
// Description: Secure input field supporting conceal/reveal toggling and
//              form validation states.
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
// - Text input element with optional password reveal toggle and error hint.
//
// Args:
//   - label: Field title placed above the input box.
//   - error: Optional error string causing border highlight and subtitle message.
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
      {label && <label className="text-xs font-semibold text-zinc-300 select-none">{label}</label>}
      <div className="relative flex items-center">
        <input
          type={effectiveType}
          className={`w-full bg-zinc-900 border ${
            error ? "border-rose-500 focus:border-rose-400" : "border-zinc-700 focus:border-blue-500"
          } rounded-lg px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 ${
            error ? "focus:ring-rose-500" : "focus:ring-blue-500"
          } transition-all ${isPassword ? "pr-10" : ""} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2.5 p-1 text-zinc-400 hover:text-zinc-200 focus:outline-none cursor-pointer"
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
