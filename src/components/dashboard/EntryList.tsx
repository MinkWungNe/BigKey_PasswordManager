// ============================================================================
// File: EntryList.tsx
// Description: Searchable list pane rendering lightweight entry headers,
//              category icons, favorite indicators, and add entry trigger
//              styled with Neutral Monochromatic glassmorphism.
// ============================================================================

import React from "react";
import {
  Search,
  Plus,
  Star,
  KeyRound,
  CreditCard,
  FileText,
  Layers,
  X,
} from "lucide-react";
import { VaultEntryHeader } from "../../types";

export interface EntryListProps {
  headers: VaultEntryHeader[];
  selectedId: string | null;
  onSelectId: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddNew: () => void;
  isLoading: boolean;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  width?: number;
}

// ----------------------------------------------------------------------------
// 1. EntryList
// - Displays instant search input and scrollable list of vault item summaries.
//
// Args:
//   - headers: Unencrypted entry header summaries.
//   - selectedId: Currently inspected item ID.
//   - onSelectId: Callback selecting an item to inspect.
//   - searchQuery: Search filter text.
//   - onSearchChange: Callback updating search filter.
//   - onAddNew: Callback launching new card modal.
//   - isLoading: Flag reflecting database query work.
//   - searchInputRef: Ref attached to search input box for shortcut focus.
//   - width: Dynamic panel width in pixels.
//
// Return:
//   - JSX.Element: Header list column layout.
// ----------------------------------------------------------------------------
export const EntryList: React.FC<EntryListProps> = ({
  headers,
  selectedId,
  onSelectId,
  searchQuery,
  onSearchChange,
  onAddNew,
  isLoading,
  searchInputRef,
  width = 320,
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "login":
        return <KeyRound size={15} />;
      case "card":
        return <CreditCard size={15} />;
      case "note":
        return <FileText size={15} />;
      default:
        return <Layers size={15} />;
    }
  };

  return (
    <div
      style={{ width: `${width}px` }}
      className="bg-zinc-900/40 dark:bg-zinc-900/40 light:bg-zinc-50/70 border-r border-zinc-800/80 dark:border-zinc-800/80 light:border-zinc-200/80 flex flex-col h-full select-none text-left shrink-0 backdrop-blur-md transition-[background-color,border-color] duration-200 overflow-hidden"
    >
      {/* Header & Search */}
      <div className="p-4 border-b border-zinc-800/80 light:border-zinc-200/80 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 light:text-zinc-600">
            Items ({headers.length})
          </span>
          <button
            onClick={onAddNew}
            className="flex items-center gap-1.5 bg-zinc-100 hover:bg-white text-zinc-950 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 light:bg-zinc-900 light:hover:bg-zinc-800 light:text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-all duration-150 cursor-pointer shadow-xs active:scale-[0.98]"
            title="Create new item (Ctrl+N)"
          >
            <Plus size={14} />
            <span>New Item</span>
            <kbd className="text-[9px] font-mono opacity-50 ml-0.5 font-normal">Ctrl+N</kbd>
          </button>
        </div>

        {/* Search Input Box */}
        <div className="relative flex items-center">
          <Search
            size={14}
            className="absolute left-3 text-zinc-500 light:text-zinc-400 pointer-events-none"
          />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search vault..."
            aria-label="Search vault credentials"
            className="w-full bg-zinc-950/70 light:bg-white border border-zinc-800 light:border-zinc-300 rounded-xl pl-9 pr-16 py-1.5 text-xs text-zinc-100 light:text-zinc-900 placeholder-zinc-500 light:placeholder-zinc-400 focus:outline-none focus:border-zinc-400 light:focus:border-zinc-800 transition-colors"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search query"
              title="Clear search"
              className="absolute right-2 p-1 rounded-md text-zinc-400 hover:text-zinc-200 light:text-zinc-500 light:hover:text-zinc-900 cursor-pointer transition-colors"
            >
              <X size={13} />
            </button>
          ) : (
            <kbd className="absolute right-2.5 text-[9px] font-mono text-zinc-500 light:text-zinc-400 bg-zinc-900/60 light:bg-zinc-100 border border-zinc-800/80 light:border-zinc-300 rounded px-1.5 py-0.5 pointer-events-none select-none">
              Ctrl+F
            </kbd>
          )}
        </div>
      </div>

      {/* Item List Scroll Area */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {isLoading && headers.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-xs text-zinc-500">
            Loading items...
          </div>
        ) : headers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-zinc-500 select-none">
            {searchQuery ? (
              <>
                <p className="text-xs font-medium text-zinc-300 light:text-zinc-700">No items match your search</p>
                <p className="text-[11px] text-zinc-500 light:text-zinc-500 mt-1">
                  Try another keyword or{" "}
                  <button
                    type="button"
                    onClick={() => onSearchChange("")}
                    className="underline text-zinc-400 light:text-zinc-700 hover:text-white light:hover:text-zinc-950 cursor-pointer font-medium"
                  >
                    clear search
                  </button>
                </p>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-2xl bg-zinc-900/60 light:bg-white border border-zinc-800/80 light:border-zinc-200 flex items-center justify-center text-zinc-400 light:text-zinc-500 mb-2 shadow-xs">
                  <Layers size={18} />
                </div>
                <p className="text-xs font-semibold text-zinc-300 light:text-zinc-800">No Vault Items Yet</p>
                <p className="text-[11px] text-zinc-500 light:text-zinc-500 mt-0.5 max-w-[180px] leading-relaxed">
                  Store logins, cards, and secure notes safely in your vault.
                </p>
                <button
                  type="button"
                  onClick={onAddNew}
                  className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 light:bg-white light:hover:bg-zinc-100 text-zinc-200 light:text-zinc-900 border border-zinc-700 light:border-zinc-300 shadow-xs cursor-pointer transition-colors"
                >
                  Create First Item
                </button>
              </>
            )}
          </div>
        ) : (
          headers.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <div
                key={item.id}
                onClick={() => onSelectId(item.id)}
                className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer border transition-all duration-150 ${
                  isSelected
                    ? "bg-zinc-800/90 dark:bg-zinc-800/90 light:bg-white border-zinc-700 dark:border-zinc-700 light:border-zinc-300 shadow-xs"
                    : "border-transparent text-zinc-400 dark:text-zinc-400 light:text-zinc-600 hover:text-zinc-100 dark:hover:text-zinc-100 light:hover:text-zinc-950 hover:bg-zinc-900/60 dark:hover:bg-zinc-900/60 light:hover:bg-white/80 light:hover:border-zinc-300/60"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                  <div
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 transition-colors duration-150 ${
                      isSelected
                        ? "bg-zinc-950 dark:bg-zinc-950 light:bg-zinc-100 border-zinc-600 dark:border-zinc-600 light:border-zinc-400 text-zinc-100 dark:text-zinc-100 light:text-zinc-900"
                        : "bg-zinc-950/60 dark:bg-zinc-950/60 light:bg-white border-zinc-800/80 dark:border-zinc-800/80 light:border-zinc-200 text-zinc-400 dark:text-zinc-400 light:text-zinc-500 group-hover:text-zinc-100 dark:group-hover:text-zinc-100 light:group-hover:text-zinc-950"
                    }`}
                  >
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                    <span
                      className={`text-xs font-semibold truncate block w-full transition-colors duration-150 ${
                        isSelected
                          ? "text-white dark:text-white light:text-zinc-950"
                          : "text-zinc-300 dark:text-zinc-300 light:text-zinc-800 group-hover:text-zinc-100 dark:group-hover:text-zinc-100 light:group-hover:text-zinc-950"
                      }`}
                    >
                      {item.title}
                    </span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-500 light:text-zinc-600 font-medium capitalize truncate block w-full">
                      {item.category}
                    </span>
                  </div>
                </div>

                {item.is_favorite && (
                  <Star size={13} className="text-zinc-300 dark:text-zinc-300 light:text-zinc-800 fill-current shrink-0 ml-2" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
