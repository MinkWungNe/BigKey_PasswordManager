// ============================================================================
// File: LockScreen.tsx
// Description: Vault unlock login screen verifying candidate Master Password
//              with Zero-Retention form purging and immediate error clearing.
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

  // --------------------------------------------------------------------------
  // Handler: handleSubmit (Zero-Retention Security Enforced)
  // - Submits candidate password to IPC and cleans input field immediately.
  // --------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError("Please enter your Master Password.");
      return;
    }

    const passwordToSubmit = password;
    // Immediately clear state to prevent hanging password in Virtual DOM
    setPassword("");

    const success = await onUnlock(passwordToSubmit);
    if (!success) {
      setError("Incorrect Master Password. Please try again.");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-zinc-950 text-zinc-100">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl flex flex-col gap-6 text-left">
        {/* Lock Icon Banner */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-blue-400">
            <Lock size={30} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Vault is Locked</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Enter your Master Password to access your credentials
            </p>
          </div>
        </div>

        {/* Unlock Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Master Password"
            isPassword
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            autoFocus
            disabled={isLoading}
          />

          {error && (
            <div className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="mt-1">
            <Unlock size={18} />
            Unlock Vault
          </Button>
        </form>
      </div>
    </div>
  );
};
