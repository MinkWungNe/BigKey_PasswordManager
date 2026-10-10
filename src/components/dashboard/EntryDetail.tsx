// ============================================================================
// File: EntryDetail.tsx
// Description: Decrypted entry inspection pane featuring hidden passwords,
//              visibility toggle, 1-click secure copy with auto-clear,
//              and Neutral Monochromatic glassmorphism card elevation.
// ============================================================================

import React, { useState } from "react";
import {
  Copy,
  Check,
  Eye,
  EyeOff,
  Star,
  Edit3,
  Trash2,
  ExternalLink,
  Shield,
  Clock,
} from "lucide-react";
import { VaultEntry } from "../../types";

export interface EntryDetailProps {
  entry: VaultEntry | null;
  isLoading: boolean;
  onEdit: (entry: VaultEntry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onCopy: (text: string, fieldId?: string, isSensitive?: boolean) => void;
  copiedFieldId: string | null;
}

// ----------------------------------------------------------------------------
// 1. EntryDetail
// - Decrypts and displays complete entry details with secure conceal/copy actions.
//
// Args:
//   - entry: Decrypted VaultEntry instance or null if no item selected.
//   - isLoading: Flag reflecting database decryption work.
//   - onEdit: Callback initiating edit mode.
//   - onDelete: Callback prompting item deletion.
//   - onToggleFavorite: Callback toggling favorite flag.
//   - onCopy: Secure clipboard handler function.
//   - copiedFieldId: Active copied field identifier.
//
// Return:
//   - JSX.Element: Detailed view pane.
// ----------------------------------------------------------------------------
export const EntryDetail: React.FC<EntryDetailProps> = ({
  entry,
  isLoading,
  onEdit,
  onDelete,
  onToggleFavorite,
  onCopy,
  copiedFieldId,
}) => {
  const [revealedFields, setRevealedFields] = useState<Record<string, boolean>>({});

  const toggleReveal = (fieldId: string) => {
    setRevealedFields((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };

  const formatDate = (timestampSec: number) => {
    return new Date(timestampSec * 1000).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950 light:bg-zinc-100 text-zinc-500 text-xs">
        Decrypting item in memory...
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 light:bg-zinc-100 text-zinc-500 p-8 text-center select-none transition-colors duration-200">
        <div className="w-16 h-16 rounded-3xl bg-zinc-900/60 light:bg-white border border-zinc-800 light:border-zinc-200 flex items-center justify-center text-zinc-500 light:text-zinc-400 mb-3 shadow-xs">
          <Shield size={26} />
        </div>
        <p className="text-sm font-semibold text-zinc-300 light:text-zinc-700">No Item Selected</p>
        <p className="text-xs text-zinc-500 light:text-zinc-400 mt-1 max-w-xs leading-relaxed">
          Select an item from the sidebar to inspect decrypted details or create a new card.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-zinc-950 light:bg-zinc-100 flex flex-col h-full overflow-y-auto text-left select-text transition-colors duration-200">
      {/* Detail Header */}
      <div className="p-6 border-b border-zinc-800/80 light:border-zinc-200/80 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex flex-col min-w-0">
            <h2 className="text-xl font-bold text-white light:text-zinc-950 tracking-tight truncate">
              {entry.title}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-zinc-800 light:bg-zinc-200 text-zinc-200 light:text-zinc-800 border border-zinc-700/60 light:border-zinc-300 uppercase tracking-wider">
                {entry.category}
              </span>
              <span className="text-xs text-zinc-500 light:text-zinc-400 flex items-center gap-1">
                <Clock size={12} />
                Updated {formatDate(entry.updated_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 select-none">
          <button
            type="button"
            onClick={() => onToggleFavorite(entry.id)}
            aria-label={entry.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
            className="p-2 rounded-xl border border-transparent text-zinc-400 dark:text-zinc-400 light:text-zinc-500 hover:text-zinc-100 dark:hover:text-zinc-100 light:hover:text-zinc-950 hover:bg-zinc-900/60 dark:hover:bg-zinc-900/60 light:hover:bg-white/80 light:hover:border-zinc-300/60 transition-all duration-150 cursor-pointer"
            title={entry.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
          >
            <Star
              size={17}
              className={
                entry.is_favorite
                  ? "text-zinc-200 dark:text-zinc-200 light:text-zinc-800 fill-current"
                  : ""
              }
            />
          </button>
          <button
            type="button"
            onClick={() => onEdit(entry)}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-zinc-700/80 dark:border-zinc-700/80 light:border-zinc-300/80 bg-zinc-900/60 dark:bg-zinc-900/60 light:bg-white/80 text-zinc-300 dark:text-zinc-300 light:text-zinc-700 hover:text-zinc-100 dark:hover:text-zinc-100 light:hover:text-zinc-950 hover:bg-zinc-900/90 dark:hover:bg-zinc-900/90 light:hover:bg-white light:hover:border-zinc-300 shadow-xs transition-all duration-150 cursor-pointer active:scale-[0.98]"
          >
            <Edit3 size={14} className="text-zinc-400 dark:text-zinc-400 light:text-zinc-500 group-hover:text-zinc-100 dark:group-hover:text-zinc-100 light:group-hover:text-zinc-950 transition-colors" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(entry.id)}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-transparent text-rose-400 dark:text-rose-400 light:text-rose-600 hover:text-rose-300 dark:hover:text-rose-300 light:hover:text-rose-700 hover:bg-zinc-900/60 dark:hover:bg-zinc-900/60 light:hover:bg-white/80 light:hover:border-zinc-300/60 transition-all duration-150 cursor-pointer active:scale-[0.98]"
          >
            <Trash2 size={14} className="text-rose-400 dark:text-rose-400 light:text-rose-600 group-hover:text-rose-300 dark:group-hover:text-rose-300 light:group-hover:text-rose-700 transition-colors" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Fields Container */}
      <div className="p-6 flex flex-col gap-4 max-w-3xl">
        {entry.fields.map((field) => {
          const isConcealed = field.field_type === "concealed";
          const isRevealed = revealedFields[field.id];
          const isCopied = copiedFieldId === field.id;

          return (
            <div
              key={field.id}
              className="bg-zinc-900/50 light:bg-white border border-zinc-800/80 light:border-zinc-200/90 rounded-2xl p-4 flex flex-col gap-1.5 shadow-xs transition-colors duration-150 backdrop-blur-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-400 light:text-zinc-500 uppercase tracking-wider">
                  {field.label}
                </span>

                <div className="flex items-center gap-1 select-none">
                  {/* Conceal/Reveal Toggle */}
                  {isConcealed && (
                    <button
                      type="button"
                      onClick={() => toggleReveal(field.id)}
                      aria-label={isRevealed ? "Conceal value" : "Reveal value"}
                      className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 light:text-zinc-500 light:hover:text-zinc-950 hover:bg-zinc-800 light:hover:bg-white light:hover:shadow-xs transition-colors cursor-pointer"
                      title={isRevealed ? "Conceal value" : "Reveal value"}
                    >
                      {isRevealed ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  )}

                  {/* External Link for URLs */}
                  {field.field_type === "url" && field.value && (
                    <a
                      href={field.value.startsWith("http") ? field.value : `https://${field.value}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Open link in browser"
                      className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 light:text-zinc-500 light:hover:text-zinc-950 hover:bg-zinc-800 light:hover:bg-white light:hover:shadow-xs transition-colors"
                      title="Open link"
                    >
                      <ExternalLink size={15} />
                    </a>
                  )}

                  {/* 1-Click Copy with 30s Auto-Clear */}
                  {field.value && (
                    <button
                      type="button"
                      onClick={() => onCopy(field.value, field.id, isConcealed)}
                      aria-label={`Copy ${field.label}`}
                      className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 light:text-zinc-500 light:hover:text-zinc-950 hover:bg-zinc-800 light:hover:bg-white light:hover:shadow-xs transition-colors cursor-pointer flex items-center gap-1 text-xs"
                      title="Copy to clipboard"
                    >
                      {isCopied ? (
                        <>
                          <Check size={14} className="text-zinc-200 light:text-zinc-900" />
                          <span className="text-[10px] text-zinc-200 light:text-zinc-900 font-medium">Copied</span>
                        </>
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Field Value Display */}
              <div className="font-mono text-sm text-zinc-100 light:text-zinc-900 break-all select-text">
                {isConcealed && !isRevealed ? (
                  <span className="tracking-widest text-zinc-500 light:text-zinc-400 font-sans">••••••••••••</span>
                ) : (
                  <span>{field.value || <em className="text-zinc-600 light:text-zinc-400 font-sans">None</em>}</span>
                )}
              </div>
            </div>
          );
        })}

        {/* Freeform Notes Section */}
        {entry.notes && (
          <div className="bg-zinc-900/50 light:bg-white border border-zinc-800/80 light:border-zinc-200/90 rounded-2xl p-4 flex flex-col gap-2 shadow-xs">
            <span className="text-[11px] font-semibold text-zinc-400 light:text-zinc-500 uppercase tracking-wider">
              Notes
            </span>
            <div className="text-xs text-zinc-200 light:text-zinc-800 whitespace-pre-wrap font-sans leading-relaxed">
              {entry.notes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
