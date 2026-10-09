// ============================================================================
// File: PasswordGeneratorModal.tsx
// Description: Interactive CSPRNG password generator modal featuring length
//              sliders, character set switches, entropy bits meter, and autofill hook.
// ============================================================================

import React, { useEffect, useState } from "react";
import { Copy, Check, RefreshCw, KeyRound } from "lucide-react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import {
  calculatePasswordStrength,
  generatePassword,
  GeneratorOptions,
} from "../../services/passwordGen";

export interface PasswordGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply?: (password: string) => void;
  onCopy: (text: string, fieldId?: string, isSensitive?: boolean) => void;
}

// ----------------------------------------------------------------------------
// 1. PasswordGeneratorModal
// - Generates random cryptographically secure passwords and evaluates entropy.
//
// Args:
//   - isOpen: Modal visibility trigger.
//   - onClose: Callback closing the modal.
//   - onApply: Optional callback injecting password into active form field.
//   - onCopy: Secure clipboard handler function.
//
// Return:
//   - JSX.Element | null: Rendered password generator dialog.
// ----------------------------------------------------------------------------
export const PasswordGeneratorModal: React.FC<PasswordGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApply,
  onCopy,
}) => {
  const [options, setOptions] = useState<GeneratorOptions>({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });

  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const handleRegenerate = () => {
    setPassword(generatePassword(options));
    setCopied(false);
  };

  useEffect(() => {
    if (isOpen) {
      handleRegenerate();
    }
  }, [isOpen, options]);

  const strength = calculatePasswordStrength(password);

  const handleCopyPassword = () => {
    onCopy(password, "generator_pass", true);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyPassword = () => {
    if (onApply) {
      onApply(password);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Password Generator" maxWidth="md">
      <div className="flex flex-col gap-5 text-left">
        {/* Output Display Box */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-base font-semibold text-white tracking-wider break-all select-all">
              {password}
            </span>
            <div className="flex items-center gap-1 shrink-0 select-none">
              <button
                type="button"
                onClick={handleRegenerate}
                className="p-2 rounded-xl text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Regenerate password"
              >
                <RefreshCw size={16} />
              </button>
              <button
                type="button"
                onClick={handleCopyPassword}
                className="p-2 rounded-xl text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Copy password"
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Entropy Gauge */}
          <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-400 font-medium">Strength: {strength.label}</span>
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
        </div>

        {/* Configuration Sliders & Toggles */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-medium text-zinc-300">
              <span>Length</span>
              <span className="font-mono text-blue-400">{options.length} characters</span>
            </div>
            <input
              type="range"
              min="8"
              max="64"
              value={options.length}
              onChange={(e) => setOptions({ ...options, length: Number(e.target.value) })}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Character Set Checkboxes */}
          <div className="grid grid-cols-2 gap-2.5 select-none">
            {[
              { key: "uppercase", label: "Uppercase (A-Z)" },
              { key: "lowercase", label: "Lowercase (a-z)" },
              { key: "numbers", label: "Numbers (0-9)" },
              { key: "symbols", label: "Symbols (!@#$...)" },
            ].map(({ key, label }) => {
              const checked = options[key as keyof GeneratorOptions] as boolean;
              return (
                <label
                  key={key}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      setOptions({ ...options, [key]: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-blue-600 bg-zinc-900 border-zinc-700 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <span>{label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-2.5 pt-2 border-t border-zinc-800/80">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
          {onApply && (
            <Button variant="primary" size="sm" onClick={handleApplyPassword}>
              <KeyRound size={15} />
              <span>Use This Password</span>
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
