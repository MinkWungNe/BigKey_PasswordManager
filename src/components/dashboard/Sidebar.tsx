// ============================================================================
// File: Sidebar.tsx
// Description: Left sidebar navigation menu supporting category selection,
//              favorites view, password generator modal trigger, and immediate vault lock.
// ============================================================================

import React from "react";
import {
  KeyRound,
  Shield,
  FileText,
  CreditCard,
  Star,
  Sparkles,
  Lock,
  Layers,
} from "lucide-react";

export interface SidebarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onOpenGenerator: () => void;
  onLock: () => void;
}

// ----------------------------------------------------------------------------
// 1. Sidebar
// - Navigation sidebar displaying categories, tools, and session termination trigger.
//
// Args:
//   - selectedCategory: Currently active category identifier.
//   - onSelectCategory: Callback switching category filter.
//   - onOpenGenerator: Callback opening password generator modal.
//   - onLock: Callback triggering backend session purging.
//
// Return:
//   - JSX.Element: Styled navigation panel.
// ----------------------------------------------------------------------------
export const Sidebar: React.FC<SidebarProps> = ({
  selectedCategory,
  onSelectCategory,
  onOpenGenerator,
  onLock,
}) => {
  const categories = [
    { id: "all", label: "All Items", icon: Layers },
    { id: "favorites", label: "Favorites", icon: Star },
    { id: "login", label: "Logins", icon: KeyRound },
    { id: "card", label: "Credit Cards", icon: CreditCard },
    { id: "note", label: "Secure Notes", icon: FileText },
  ];

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between p-4 h-full select-none text-left shrink-0">
      {/* Top Branding & Navigation */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 px-2 pt-2">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">BigKey</h2>
            <p className="text-[10px] text-zinc-400">One Key for All</p>
          </div>
        </div>

        {/* Categories Menu */}
        <nav className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-zinc-500 px-3 uppercase tracking-wider mb-1">
            Vault Categories
          </span>
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                <Icon size={18} className={isActive ? "text-blue-400" : "text-zinc-400"} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-2 pt-4 border-t border-zinc-800/80">
        <button
          onClick={onOpenGenerator}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 transition-all cursor-pointer"
        >
          <Sparkles size={16} />
          <span>Password Generator</span>
        </button>

        <button
          onClick={onLock}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
        >
          <Lock size={16} />
          <span>Lock Vault</span>
        </button>
      </div>
    </aside>
  );
};
