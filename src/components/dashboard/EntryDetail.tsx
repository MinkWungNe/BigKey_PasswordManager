// ============================================================================
// File: EntryDetail.tsx
// Description: Decrypted entry inspection pane featuring hidden passwords,
//              visibility toggle, 1-click secure copy with auto-clear, and edit triggers.
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
import { Button } from "../common/Button";

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
      <div className="flex-1 flex items-center justify-center bg-zinc-950 text-zinc-500 text-xs">
        Decrypting item in memory...
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 text-zinc-500 p-8 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 mb-3">
          <Shield size={28} />
        </div>
        <p className="text-sm font-medium text-zinc-400">No Item Selected</p>
        <p className="text-xs text-zinc-600 mt-1 max-w-xs">
          Select an item from the list to view decrypted details or create a new entry.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-zinc-950 flex flex-col h-full overflow-y-auto text-left select-text">
      {/* Detail Header */}
      <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex flex-col min-w-0">
            <h2 className="text-xl font-bold text-white tracking-tight truncate">
              {entry.title}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-600/20 text-blue-400 border border-blue-500/30 uppercase tracking-wider">
                {entry.category}
              </span>
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <Clock size={12} />
                Updated {formatDate(entry.updated_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 select-none">
          <button
            onClick={() => onToggleFavorite(entry.id)}
            className="p-2 rounded-xl text-zinc-400 hover:text-amber-400 hover:bg-zinc-900 transition-colors cursor-pointer"
            title={entry.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
          >
            <Star
              size={18}
              className={entry.is_favorite ? "text-amber-400 fill-amber-400" : ""}
            />
          </button>
          <Button variant="secondary" size="sm" onClick={() => onEdit(entry)}>
            <Edit3 size={14} />
            <span>Edit</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(entry.id)} className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10">
            <Trash2 size={14} />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Fields Container */}
      <div className="p-6 flex flex-col gap-5 max-w-3xl">
        {entry.fields.map((field) => {
          const isConcealed = field.field_type === "concealed";
          const isRevealed = revealedFields[field.id];
          const isCopied = copiedFieldId === field.id;

          return (
            <div
              key={field.id}
              className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  {field.label}
                </span>

                <div className="flex items-center gap-1 select-none">
                  {/* Conceal/Reveal Toggle */}
                  {isConcealed && (
                    <button
                      type="button"
                      onClick={() => toggleReveal(field.id)}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
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
                      className="p-1 rounded text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition-colors"
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
                      className="p-1 rounded text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1 text-xs"
                      title="Copy to clipboard"
                    >
                      {isCopied ? (
                        <>
                          <Check size={15} className="text-emerald-400" />
                          <span className="text-[11px] text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <Copy size={15} />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Field Value Display */}
              <div className="font-mono text-sm text-zinc-100 break-all select-text">
                {isConcealed && !isRevealed ? (
                  <span className="tracking-widest text-zinc-500 font-sans">••••••••••••</span>
                ) : (
                  <span>{field.value || <em className="text-zinc-600 font-sans">None</em>}</span>
                )}
              </div>
            </div>
          );
        })}

        {/* Freeform Notes Section */}
        {entry.notes && (
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Notes
            </span>
            <div className="text-xs text-zinc-200 whitespace-pre-wrap font-sans leading-relaxed">
              {entry.notes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
