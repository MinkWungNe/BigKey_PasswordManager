// ============================================================================
// File: SettingsView.tsx
// Description: Full-height settings view replacing detail pane with appearance
//              theme selection, auto-lock configuration, and studio credentials.
// ============================================================================

import React from "react";
import { Shield, Moon, Sun, ArrowLeft, Clock, Info } from "lucide-react";
import { ThemeMode } from "../../hooks/useTheme";

export interface SettingsViewProps {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onClose: () => void;
}

// ----------------------------------------------------------------------------
// 1. SettingsView
// - Displays application preferences: Dual Theme, Auto-Lock, and Studio details.
//
// Args:
//   - theme: Active theme mode ('dark' | 'light').
//   - onThemeChange: Callback updating theme state.
//   - onClose: Callback closing settings and restoring item detail view.
//
// Return:
//   - JSX.Element: Styled settings layout.
// ----------------------------------------------------------------------------
export const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  onThemeChange,
  onClose,
}) => {
  return (
    <div className="flex-1 bg-zinc-950 light:bg-zinc-100 flex flex-col h-full overflow-y-auto text-left transition-colors duration-200">
      {/* Top Header */}
      <div className="p-6 border-b border-zinc-800/80 light:border-zinc-200/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to items"
            className="p-2 rounded-xl border border-transparent text-zinc-400 hover:text-zinc-100 dark:hover:text-zinc-100 light:text-zinc-600 light:hover:text-zinc-950 hover:bg-zinc-900/60 dark:hover:bg-zinc-900/60 light:hover:bg-white light:hover:border-zinc-300 light:hover:shadow-xs transition-all duration-150 cursor-pointer"
            title="Back to items"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white light:text-zinc-950">
              Preferences & Settings
            </h2>
            <p className="text-xs text-zinc-400 light:text-zinc-500 mt-0.5">
              Customize appearance, security behavior, and system information
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings Sections */}
      <div className="p-6 flex flex-col gap-8 max-w-2xl">
        {/* Section 1: Appearance Theme - Segmented Control Slider */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-400 light:text-zinc-600">
            <Moon size={14} />
            <span>Appearance & Theme</span>
          </div>

          {/* Segmented Control Track */}
          <div className="p-1 rounded-2xl bg-zinc-900/80 dark:bg-zinc-900/80 light:bg-zinc-200/90 border border-zinc-800 dark:border-zinc-800 light:border-zinc-300 grid grid-cols-3 gap-1 relative shadow-inner">
            {/* Light Mode Option */}
            <button
              type="button"
              onClick={() => onThemeChange("light")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                theme === "light"
                  ? "bg-white text-zinc-950 shadow-xs"
                  : "text-zinc-400 dark:text-zinc-400 light:text-zinc-600 hover:text-zinc-200 dark:hover:text-zinc-200 light:hover:text-zinc-950 hover:bg-zinc-800/40 dark:hover:bg-zinc-800/40 light:hover:bg-zinc-100/60"
              }`}
            >
              <Sun size={15} />
              <span>Light</span>
            </button>

            {/* Dark Mode Option */}
            <button
              type="button"
              onClick={() => onThemeChange("dark")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                theme === "dark"
                  ? "bg-zinc-800 text-white shadow-xs"
                  : "text-zinc-400 dark:text-zinc-400 light:text-zinc-600 hover:text-zinc-200 dark:hover:text-zinc-200 light:hover:text-zinc-950 hover:bg-zinc-800/40 dark:hover:bg-zinc-800/40 light:hover:bg-zinc-100/60"
              }`}
            >
              <Moon size={15} />
              <span>Dark</span>
            </button>

            {/* System Default Option */}
            <button
              type="button"
              onClick={() => onThemeChange("system")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                theme === "system"
                  ? "bg-zinc-800 dark:bg-zinc-800 light:bg-white text-white dark:text-white light:text-zinc-950 shadow-xs"
                  : "text-zinc-400 dark:text-zinc-400 light:text-zinc-600 hover:text-zinc-200 dark:hover:text-zinc-200 light:hover:text-zinc-950 hover:bg-zinc-800/40 dark:hover:bg-zinc-800/40 light:hover:bg-zinc-100/60"
              }`}
            >
              <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[9px] font-bold">
                A
              </span>
              <span>System</span>
            </button>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-500 light:text-zinc-500 px-1">
            {theme === "system"
              ? "Automatically synchronizes with your operating system color scheme."
              : theme === "light"
              ? "Crisp alabaster glassmorphism with high contrast readability."
              : "Obsidian deep background with refined dark glass accents."}
          </p>
        </div>

        {/* Section 2: Security & Auto-Lock */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 light:text-zinc-600">
            <Clock size={14} />
            <span>Vault Security & Auto-Lock</span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/50 light:bg-white border border-zinc-800 light:border-zinc-200 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-zinc-100 light:text-zinc-900">
                  Inactivity Timeout
                </span>
                <p className="text-xs text-zinc-400 light:text-zinc-500 mt-0.5">
                  Automatically clears memory session key after idle time
                </p>
              </div>
              <span className="text-xs font-mono font-medium px-3 py-1 rounded-xl bg-zinc-800 light:bg-zinc-100 text-zinc-200 light:text-zinc-800 border border-zinc-700/60 light:border-zinc-300">
                5 Minutes (Default)
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 light:text-zinc-500 italic">
              * Managed by native Rust kernel session guard with Zeroize memory purging.
            </p>
          </div>
        </div>

        {/* Section 3: Studio & App Metadata */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 light:text-zinc-600">
            <Info size={14} />
            <span>About BigKey</span>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/50 light:bg-white border border-zinc-800 light:border-zinc-200 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 light:bg-zinc-100 border border-zinc-700 light:border-zinc-300 flex items-center justify-center text-zinc-200 light:text-zinc-800">
                <Shield size={22} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-100 light:text-zinc-950">
                  BigKey Password Manager
                </h4>
                <p className="text-xs text-zinc-400 light:text-zinc-500">
                  Version 0.1.0 • Core MVP Edition
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800/80 light:border-zinc-200/80 text-xs">
              <div>
                <span className="text-zinc-500 light:text-zinc-400 block">Developed by:</span>
                <span className="font-medium text-zinc-200 light:text-zinc-800">
                  MinkWungNe Studio
                </span>
              </div>
              <div>
                <span className="text-zinc-500 light:text-zinc-400 block">Package Identifier:</span>
                <span className="font-mono text-zinc-300 light:text-zinc-700">
                  com.minkwungne.bigkey
                </span>
              </div>
              <div>
                <span className="text-zinc-500 light:text-zinc-400 block">Encryption Standard:</span>
                <span className="font-mono text-zinc-300 light:text-zinc-700">
                  XChaCha20-Poly1305 + Argon2id
                </span>
              </div>
              <div>
                <span className="text-zinc-500 light:text-zinc-400 block">Architecture:</span>
                <span className="text-zinc-300 light:text-zinc-700">
                  Zero-Knowledge • Local-First
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
