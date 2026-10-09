// ============================================================================
// File: SetupScreen.tsx
// Description: Onboarding setup view for initial Master Password generation
//              with Zero-Retention form purging and Zero-Knowledge warnings.
// ============================================================================

import React, { useState } from "react";
import { KeyRound, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { calculatePasswordStrength } from "../../services/passwordGen";

export interface SetupScreenProps {
  onInitialize: (masterPassword: string) => Promise<boolean>;
  isLoading: boolean;
}

// ----------------------------------------------------------------------------
// 1. SetupScreen
// - Manages first-time vault setup flow and clears passwords from RAM post-submit.
//
// Args:
//   - onInitialize: Async callback passing master password to Argon2id backend.
//   - isLoading: Flag reflecting background KDF derivation work.
//
// Return:
//   - JSX.Element: Rendered onboarding user interface.
// ----------------------------------------------------------------------------
export const SetupScreen: React.FC<SetupScreenProps> = ({ onInitialize, isLoading }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const strength = calculatePasswordStrength(password);

  // --------------------------------------------------------------------------
  // Handler: handleSubmit (Zero-Retention Security Enforced)
  // - Validates requirements, dispatches IPC, and immediately clears local state.
  // --------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Step 1. Validate password equality and minimal criteria
    if (password.length < 8) {
      setError("Master Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    // Step 2. Cache sensitive string reference and immediately purge state
    const passwordToSubmit = password;
    setPassword("");
    setConfirmPassword("");

    // Step 3. Dispatch initialization request to Tauri IPC backend
    const success = await onInitialize(passwordToSubmit);
    if (!success) {
      setError("Failed to initialize vault. Please try again.");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-zinc-950 text-zinc-100">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl flex flex-col gap-6 text-left">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <KeyRound size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Welcome to BigKey</h1>
            <p className="text-xs text-zinc-400 mt-1">
              One Key for All • Zero-Knowledge Local Password Vault
            </p>
          </div>
        </div>

        {/* Zero-Knowledge Disclaimer */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
          <ShieldAlert size={18} className="shrink-0 mt-0.5" />
          <p>
            <strong>Important:</strong> BigKey never transmits or stores your Master Password on any
            remote server. If you lose this password, your vault cannot be recovered.
          </p>
        </div>

        {/* Setup Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Create Master Password"
            isPassword
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Choose a strong, memorable master password"
            autoFocus
            disabled={isLoading}
          />

          {/* Password Strength Indicator */}
          {password.length > 0 && (
            <div className="flex flex-col gap-1.5 -mt-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Strength: {strength.label}</span>
                <span className="text-zinc-500">{strength.entropy} bits entropy</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden flex gap-1">
                {[1, 2, 3, 4].map((tier) => (
                  <div
                    key={tier}
                    className={`h-full flex-1 rounded-full transition-all duration-300 ${
                      tier <= strength.score ? strength.colorClass : "bg-transparent"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          <Input
            label="Confirm Master Password"
            isPassword
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat your master password"
            disabled={isLoading}
          />

          {error && <div className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg">{error}</div>}

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="mt-2">
            <Sparkles size={18} />
            Create Secure Vault
          </Button>
        </form>
      </div>
    </div>
  );
};
