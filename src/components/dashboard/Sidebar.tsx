// ============================================================================
// File: Sidebar.tsx
// Description: Left sidebar navigation menu supporting category selection,
//              favorites view, password generator modal trigger, settings toggle,
//              and immediate vault lock with Neutral Monochromatic styling.
// ============================================================================

import React from "react";
import {
  KeyRound,
  FileText,
  CreditCard,
  Star,
  Sparkles,
  Lock,
  Layers,
  Settings,
} from "lucide-react";

export interface SidebarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onOpenGenerator: () => void;
  onOpenSettings: () => void;
  onLock: () => void;
  isSettingsActive: boolean;
  counts?: Record<string, number>;
  width?: number;
}

// ----------------------------------------------------------------------------
// 1. Sidebar
// - Navigation sidebar displaying categories, tools, settings, and lock action.
// ----------------------------------------------------------------------------
export const Sidebar: React.FC<SidebarProps> = ({
  selectedCategory,
  onSelectCategory,
  onOpenGenerator,
  onOpenSettings,
  onLock,
  isSettingsActive,
  counts,
  width = 224,
}) => {
  const categories = [
    { id: "all", label: "All Items", icon: Layers },
    { id: "favorites", label: "Favorites", icon: Star },
    { id: "login", label: "Logins", icon: KeyRound },
    { id: "card", label: "Credit Cards", icon: CreditCard },
    { id: "note", label: "Secure Notes", icon: FileText },
  ];

  return (
    <aside
      style={{ width: `${width}px` }}
      className="bg-zinc-950/80 dark:bg-zinc-950/80 light:bg-zinc-100/90 border-r border-zinc-800/80 dark:border-zinc-800/80 light:border-zinc-200/80 flex flex-col justify-between p-3 h-full select-none text-left shrink-0 backdrop-blur-xl transition-[background-color,border-color] duration-200 overflow-hidden"
    >
      {/* Categories Menu */}
      <div className="flex flex-col gap-2 min-w-0">
        <nav className="flex flex-col gap-1 min-w-0">
          <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-500 light:text-zinc-500 px-2.5 uppercase tracking-wider mb-1 select-none">
            Categories
          </span>
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = !isSettingsActive && selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium border transition-all duration-150 cursor-pointer min-w-0 ${
                  isActive
                    ? "bg-zinc-800/90 dark:bg-zinc-800/90 light:bg-white text-white dark:text-white light:text-zinc-950 border-zinc-700 dark:border-zinc-700 light:border-zinc-300 shadow-xs"
                    : "border-transparent text-zinc-400 dark:text-zinc-400 light:text-zinc-600 hover:text-zinc-100 dark:hover:text-zinc-100 light:hover:text-zinc-950 hover:bg-zinc-850/60 dark:hover:bg-zinc-900/60 light:hover:bg-white/80 light:hover:border-zinc-300/60"
                }`}
              >
                <Icon
                  size={15}
                  className={`shrink-0 transition-colors duration-150 ${
                    isActive
                      ? "text-white dark:text-white light:text-zinc-950"
                      : "text-zinc-400 dark:text-zinc-400 light:text-zinc-500 group-hover:text-zinc-100 dark:group-hover:text-zinc-100 light:group-hover:text-zinc-950"
                  }`}
                />
                <span className="truncate flex-1 min-w-0 text-left">{cat.label}</span>
                {counts && typeof counts[cat.id] === "number" && (
                  <span
                    className={`shrink-0 ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-semibold transition-colors duration-150 ${
                      isActive
                        ? "bg-zinc-700/80 dark:bg-zinc-700/80 light:bg-zinc-100 text-zinc-200 dark:text-zinc-200 light:text-zinc-800"
                        : "text-zinc-500 dark:text-zinc-500 light:text-zinc-400 group-hover:text-zinc-200 dark:group-hover:text-zinc-200 light:group-hover:text-zinc-900 group-hover:bg-zinc-800/60 dark:group-hover:bg-zinc-800/60 light:group-hover:bg-zinc-200/60"
                    }`}
                  >
                    {counts[cat.id]}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-1 pt-3 border-t border-zinc-800/80 dark:border-zinc-800/80 light:border-zinc-200/80">
        <button
          onClick={onOpenGenerator}
          className="group flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-transparent text-zinc-400 dark:text-zinc-400 light:text-zinc-600 hover:text-zinc-100 dark:hover:text-zinc-100 light:hover:text-zinc-950 hover:bg-zinc-900/60 dark:hover:bg-zinc-900/60 light:hover:bg-white/80 light:hover:border-zinc-300/60 transition-all duration-150 cursor-pointer"
        >
          <Sparkles size={14} className="text-zinc-400 dark:text-zinc-400 light:text-zinc-500 group-hover:text-zinc-100 dark:group-hover:text-zinc-100 light:group-hover:text-zinc-950 transition-colors" />
          <span className="truncate">Generator</span>
        </button>

        <button
          onClick={onOpenSettings}
          className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150 cursor-pointer ${
            isSettingsActive
              ? "bg-zinc-800/90 dark:bg-zinc-800/90 light:bg-white text-white dark:text-white light:text-zinc-950 border-zinc-700 dark:border-zinc-700 light:border-zinc-300 shadow-xs"
              : "border-transparent text-zinc-400 dark:text-zinc-400 light:text-zinc-600 hover:text-zinc-100 dark:hover:text-zinc-100 light:hover:text-zinc-950 hover:bg-zinc-900/50 dark:hover:bg-zinc-900/50 light:hover:bg-white/80 light:hover:border-zinc-300/60"
          }`}
        >
          <Settings size={14} className={`transition-colors ${isSettingsActive ? "text-white dark:text-white light:text-zinc-950" : "text-zinc-400 dark:text-zinc-400 light:text-zinc-500 group-hover:text-zinc-100 dark:group-hover:text-zinc-100 light:group-hover:text-zinc-950"}`} />
          <span className="truncate">Settings</span>
        </button>

        <button
          onClick={onLock}
          className="group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium border border-transparent text-zinc-400 dark:text-zinc-400 light:text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors duration-150 cursor-pointer mt-0.5"
        >
          <div className="flex items-center gap-2">
            <Lock size={14} />
            <span className="truncate">Lock Vault</span>
          </div>
          <kbd className="text-[10px] font-mono text-zinc-500 group-hover:text-rose-400/80 px-1 py-0.5 rounded bg-zinc-900/60 dark:bg-zinc-900/60 light:bg-zinc-200/60 border border-zinc-800 dark:border-zinc-800 light:border-zinc-300">
            Ctrl+L
          </kbd>
        </button>
      </div>
    </aside>
  );
};
