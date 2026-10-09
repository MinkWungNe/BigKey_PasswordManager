// ============================================================================
// File: useEntries.ts
// Description: Custom React hook managing vault entries, headers listing,
//              category filtering, instant search, and decrypted details.
// ============================================================================

import { useCallback, useEffect, useState } from "react";
import {
  createEntry,
  deleteEntry,
  getEntry,
  listEntryHeaders,
  searchEntryHeaders,
  toggleFavorite,
  updateEntry,
} from "../services/tauriApi";
import { VaultEntry, VaultEntryHeader } from "../types";

export interface EntriesHookState {
  headers: VaultEntryHeader[];
  selectedEntry: VaultEntry | null;
  selectedId: string | null;
  selectedCategory: string;
  searchQuery: string;
  isLoading: boolean;
  isDetailLoading: boolean;
  error: string | null;
  setSelectedCategory: (cat: string) => void;
  setSearchQuery: (query: string) => void;
  selectEntryById: (id: string | null) => Promise<void>;
  reloadHeaders: () => Promise<void>;
  saveEntry: (entry: VaultEntry, isNew: boolean) => Promise<boolean>;
  removeEntry: (id: string) => Promise<boolean>;
  toggleEntryFavorite: (id: string) => Promise<void>;
  clearCache: () => void;
}

// ----------------------------------------------------------------------------
// 1. useEntries
// - Coordinates entry header browsing, category filtering, search, and CRUD.
//
// Args:
//   - isUnlocked: Boolean flag indicating if vault is currently unlocked.
//
// Return:
//   - EntriesHookState: State variables and operational actions.
// ----------------------------------------------------------------------------
export function useEntries(isUnlocked: boolean): EntriesHookState {
  const [headers, setHeaders] = useState<VaultEntryHeader[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<VaultEntry | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // Handler: clearCache
  // - Purges in-memory decrypted entry state when locking or logging out.
  // --------------------------------------------------------------------------
  const clearCache = useCallback(() => {
    setHeaders([]);
    setSelectedEntry(null);
    setSelectedId(null);
    setSearchQuery("");
    setError(null);
  }, []);

  // --------------------------------------------------------------------------
  // Handler: reloadHeaders
  // - Queries unencrypted entry headers or triggers SQL search.
  // --------------------------------------------------------------------------
  const reloadHeaders = useCallback(async () => {
    if (!isUnlocked) {
      clearCache();
      return;
    }

    setIsLoading(true);
    try {
      const catFilter = selectedCategory === "all" || selectedCategory === "favorites"
        ? undefined
        : selectedCategory;

      let list: VaultEntryHeader[];
      if (searchQuery.trim().length > 0) {
        list = await searchEntryHeaders(searchQuery.trim(), catFilter);
      } else {
        list = await listEntryHeaders();
        if (catFilter) {
          list = list.filter((item) => item.category === catFilter);
        }
      }

      if (selectedCategory === "favorites") {
        list = list.filter((item) => item.is_favorite);
      }

      setHeaders(list);
      setError(null);
    } catch (err: unknown) {
      console.error("Failed to load entry headers:", err);
      const msg = typeof err === "object" && err !== null && "message" in err 
        ? String((err as { message: unknown }).message)
        : String(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [isUnlocked, selectedCategory, searchQuery, clearCache]);

  useEffect(() => {
    reloadHeaders();
  }, [reloadHeaders]);

  // --------------------------------------------------------------------------
  // Handler: selectEntryById
  // - Loads and decrypts detailed item payload into memory.
  // --------------------------------------------------------------------------
  const selectEntryById = useCallback(
    async (id: string | null) => {
      setSelectedId(id);
      if (!id) {
        setSelectedEntry(null);
        return;
      }

      setIsDetailLoading(true);
      try {
        const entry = await getEntry(id);
        setSelectedEntry(entry);
      } catch (err: unknown) {
        console.error("Failed to decrypt entry:", err);
        setSelectedEntry(null);
      } finally {
        setIsDetailLoading(false);
      }
    },
    []
  );

  // --------------------------------------------------------------------------
  // Handler: saveEntry
  // - Persists new entry or updates existing item in SQLite storage.
  // --------------------------------------------------------------------------
  const saveEntry = useCallback(
    async (entry: VaultEntry, isNew: boolean): Promise<boolean> => {
      try {
        if (isNew) {
          await createEntry(entry);
        } else {
          await updateEntry(entry);
        }
        await reloadHeaders();
        await selectEntryById(entry.id);
        return true;
      } catch (err: unknown) {
        console.error("Failed to save entry:", err);
        const msg = typeof err === "object" && err !== null && "message" in err 
          ? String((err as { message: unknown }).message)
          : String(err);
        setError(msg);
        return false;
      }
    },
    [reloadHeaders, selectEntryById]
  );

  // --------------------------------------------------------------------------
  // Handler: removeEntry
  // - Permanently deletes entry and refreshes header list.
  // --------------------------------------------------------------------------
  const removeEntry = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const deleted = await deleteEntry(id);
        if (deleted) {
          if (selectedId === id) {
            setSelectedId(null);
            setSelectedEntry(null);
          }
          await reloadHeaders();
        }
        return deleted;
      } catch (err: unknown) {
        console.error("Failed to delete entry:", err);
        return false;
      }
    },
    [selectedId, reloadHeaders]
  );

  // --------------------------------------------------------------------------
  // Handler: toggleEntryFavorite
  // - Inverts favorite flag on record and updates cached headers.
  // --------------------------------------------------------------------------
  const toggleEntryFavorite = useCallback(
    async (id: string) => {
      try {
        const newFav = await toggleFavorite(id);
        setHeaders((prev) =>
          prev.map((item) => (item.id === id ? { ...item, is_favorite: newFav } : item))
        );
        if (selectedEntry?.id === id) {
          setSelectedEntry({ ...selectedEntry, is_favorite: newFav });
        }
      } catch (err) {
        console.error("Failed to toggle favorite:", err);
      }
    },
    [selectedEntry]
  );

  return {
    headers,
    selectedEntry,
    selectedId,
    selectedCategory,
    searchQuery,
    isLoading,
    isDetailLoading,
    error,
    setSelectedCategory,
    setSearchQuery,
    selectEntryById,
    reloadHeaders,
    saveEntry,
    removeEntry,
    toggleEntryFavorite,
    clearCache,
  };
}
