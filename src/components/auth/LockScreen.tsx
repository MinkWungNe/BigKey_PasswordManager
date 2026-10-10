// ============================================================================
// File: LockScreen.tsx
// Description: Vault unlock login screen verifying candidate Master Password
//              with Zero-Retention form purging and Neutral Monochromatic styling.
// ============================================================================

import React, { useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { Button } from "../common/Button";
import { Input } from "../common/Input";

export interface LockScreenProps {
  onUnlock: (masterPassword: string) => Promise<boolean>;
  isLoading: boolean;
}

// ----------------------------------------------------------------------------
// 1. LockScreen
// - Handles master password input, invokes argon2id unlock, and clears RAM state.
//
// Args:
//   - onUnlock: Async callback invoking unlock IPC command.
//   - isLoading: Flag tracking Argon2id CPU derivation on worker thread.
//
// Return:
//   - JSX.Element: Rendered unlock view.
// ----------------------------------------------------------------------------
export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, isLoading }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [isShaking, setIsShaking] = useState(false);

  // --------------------------------------------------------------------------
  // Handler: handleSubmit (Zero-Retention Security Enforced)
  // - Submits candidate password to IPC and cleans input field immediately.
  // --------------------------------------------------------------------------
  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError(null);
    setIsShaking(false);

    if (!password) {
      setError("Please enter your Master Password.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    const passwordToSubmit = password;
    // Immediately clear state to prevent hanging password in Virtual DOM
    setPassword("");

    const success = await onUnlock(passwordToSubmit);
    if (!success) {
      setError("Incorrect Master Password. Please try again.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center p-4 bg-zinc-950 dark:bg-zinc-950 light:bg-zinc-100 text-zinc-100 dark:text-zinc-100 light:text-zinc-900 transition-colors duration-200">
      <div className="w-full max-w-sm bg-zinc-900/80 dark:bg-zinc-900/80 light:bg-white border border-zinc-800 dark:border-zinc-800 light:border-zinc-200 rounded-3xl p-8 shadow-2xl flex flex-col gap-6 text-left backdrop-blur-xl">
        {/* Lock Icon Banner */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-3xl bg-zinc-800 dark:bg-zinc-800 light:bg-zinc-100 border border-zinc-700 dark:border-zinc-700 light:border-zinc-300 flex items-center justify-center text-zinc-100 dark:text-zinc-100 light:text-zinc-900 shadow-sm">
            <Lock size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white dark:text-white light:text-zinc-950">
              Vault is Locked
            </h1>
            <p className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-1">
              Enter your Master Password to access credentials
            </p>
          </div>
        </div>

        {/* Unlock Form */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <Input
            label="Master Password"
            isPassword
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            placeholder="••••••••••••"
            autoFocus
            disabled={isLoading}
          />

          {/* Reserved Error Slot - Keeps Height Completely Stable */}
          <div className="h-6 flex items-center justify-center text-center my-1 select-none">
            {error && (
              <span className="text-xs font-medium text-rose-400 animate-in fade-in duration-150">
                {error}
              </span>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className={`w-full transition-all duration-200 ${
              isShaking
                ? "animate-shake !bg-rose-600 !text-white !border-rose-500 shadow-rose-900/50"
                : ""
            }`}
          >
            <Unlock size={16} />
            <span>Unlock Vault</span>
          </Button>
        </form>
      </div>
    </div>
  );
};
