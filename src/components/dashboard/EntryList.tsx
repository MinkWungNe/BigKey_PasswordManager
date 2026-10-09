// ============================================================================
// File: EntryList.tsx
// Description: Searchable list pane rendering lightweight entry headers,
//              category icons, favorite indicators, and add entry trigger.
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
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "login":
        return <KeyRound size={16} className="text-blue-400" />;
      case "card":
        return <CreditCard size={16} className="text-emerald-400" />;
      case "note":
        return <FileText size={16} className="text-amber-400" />;
      default:
        return <Layers size={16} className="text-purple-400" />;
    }
  };

  return (
    <div className="w-80 bg-zinc-900 border-r border-zinc-800/80 flex flex-col h-full select-none text-left shrink-0">
      {/* Header & Search */}
      <div className="p-4 border-b border-zinc-800/80 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-200">
            Vault Items ({headers.length})
          </span>
          <button
            onClick={onAddNew}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>New Item</span>
          </button>
        </div>

        {/* Search Input Box */}
        <div className="relative flex items-center">
          <Search size={15} className="absolute left-3 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search items..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Item List Scroll Area */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {isLoading && headers.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-xs text-zinc-500">
            Loading items...
          </div>
        ) : headers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-zinc-500">
            <p className="text-xs">No items found</p>
            {searchQuery && (
              <p className="text-[11px] text-zinc-600 mt-1">Try another search keyword</p>
            )}
          </div>
        ) : (
          headers.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <div
                key={item.id}
                onClick={() => onSelectId(item.id)}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-zinc-800 border border-zinc-700/80 shadow-xs"
                    : "hover:bg-zinc-800/40 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-zinc-100 truncate">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-zinc-500 capitalize">{item.category}</span>
                  </div>
                </div>

                {item.is_favorite && (
                  <Star size={14} className="text-amber-400 fill-amber-400 shrink-0 ml-2" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
