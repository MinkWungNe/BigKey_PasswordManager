// ============================================================================
// File: tauriApi.ts
// Description: Type-safe client wrappers for Tauri IPC commands handling
//              vault lifecycle, CRUD operations, fast header query, and search.
// ============================================================================

import { invoke } from "@tauri-apps/api/core";
import { VaultEntry, VaultEntryHeader, VaultStatus } from "../types";

// ----------------------------------------------------------------------------
// 1. getVaultStatus
// - Queries initialization status and lock state of the backend vault.
//
// Args:
//   - None.
//
// Return:
//   - Promise<VaultStatus>: Current vault lifecycle status.
// ----------------------------------------------------------------------------
export async function getVaultStatus(): Promise<VaultStatus> {
  return await invoke<VaultStatus>("get_vault_status");
}

// ----------------------------------------------------------------------------
// 2. initVault
// - Initializes vault with user master password and derives primary master key.
//
// Args:
//   - masterPassword: Plaintext master password for first-time vault setup.
//
// Return:
//   - Promise<void>: Resolves when metadata is stored and session is unlocked.
// ----------------------------------------------------------------------------
export async function initVault(masterPassword: string): Promise<void> {
  await invoke<void>("init_vault", { masterPassword });
}

// ----------------------------------------------------------------------------
// 3. unlockVault
// - Verifies candidate master password against SQLite verifier token.
//
// Args:
//   - masterPassword: Candidate master password for decryption session.
//
// Return:
//   - Promise<void>: Resolves if password is valid and session key initialized.
// ----------------------------------------------------------------------------
export async function unlockVault(masterPassword: string): Promise<void> {
  await invoke<void>("unlock_vault", { masterPassword });
}

// ----------------------------------------------------------------------------
// 4. lockVault
// - Immediately purges session decryption key from backend memory.
//
// Args:
//   - None.
//
// Return:
//   - Promise<void>: Resolves on successful session termination.
// ----------------------------------------------------------------------------
export async function lockVault(): Promise<void> {
  await invoke<void>("lock_vault");
}

// ----------------------------------------------------------------------------
// 5. resetActivity
// - Refreshes inactivity timer in backend to prevent premature auto-lock.
//
// Args:
//   - None.
//
// Return:
//   - Promise<void>: Resolves on touch execution.
// ----------------------------------------------------------------------------
export async function resetActivity(): Promise<void> {
  await invoke<void>("reset_activity");
}

// ----------------------------------------------------------------------------
// 6. listEntryHeaders
// - Fetches lightweight list of entry headers without decrypting item payloads.
//
// Args:
//   - None.
//
// Return:
//   - Promise<VaultEntryHeader[]>: List of unencrypted header summaries.
// ----------------------------------------------------------------------------
export async function listEntryHeaders(): Promise<VaultEntryHeader[]> {
  return await invoke<VaultEntryHeader[]>("list_entry_headers");
}

// ----------------------------------------------------------------------------
// 7. getEntry
// - Retrieves and decrypts dynamic fields of a specific vault entry by ID.
//
// Args:
//   - id: Unique identifier string of the entry.
//
// Return:
//   - Promise<VaultEntry | null>: Decrypted entry or null if record not found.
// ----------------------------------------------------------------------------
export async function getEntry(id: string): Promise<VaultEntry | null> {
  return await invoke<VaultEntry | null>("get_entry", { id });
}

// ----------------------------------------------------------------------------
// 8. createEntry
// - Encrypts sensitive fields and inserts new entry row into SQLite database.
//
// Args:
//   - entry: Complete in-memory VaultEntry object with title, category & fields.
//
// Return:
//   - Promise<void>: Resolves on successful storage.
// ----------------------------------------------------------------------------
export async function createEntry(entry: VaultEntry): Promise<void> {
  await invoke<void>("create_entry", { entry });
}

// ----------------------------------------------------------------------------
// 9. updateEntry
// - Re-encrypts payload and updates existing record in SQLite database.
//
// Args:
//   - entry: Updated VaultEntry object.
//
// Return:
//   - Promise<void>: Resolves on successful update.
// ----------------------------------------------------------------------------
export async function updateEntry(entry: VaultEntry): Promise<void> {
  await invoke<void>("update_entry", { entry });
}

// ----------------------------------------------------------------------------
// 10. deleteEntry
// - Permanently deletes an entry from SQLite by its identifier.
//
// Args:
//   - id: Unique entry identifier string.
//
// Return:
//   - Promise<boolean>: True if deleted, false if record was not found.
// ----------------------------------------------------------------------------
export async function deleteEntry(id: string): Promise<boolean> {
  return await invoke<boolean>("delete_entry", { id });
}

// ----------------------------------------------------------------------------
// 11. toggleFavorite
// - Inverts favorite flag of a vault entry without touching payload ciphertext.
//
// Args:
//   - id: Unique entry identifier string.
//
// Return:
//   - Promise<boolean>: Updated favorite boolean state.
// ----------------------------------------------------------------------------
export async function toggleFavorite(id: string): Promise<boolean> {
  return await invoke<boolean>("toggle_favorite", { id });
}

// ----------------------------------------------------------------------------
// 12. searchEntries
// - Deep searches entries across decrypted titles, categories, and field values.
//
// Args:
//   - query: Free-text search term.
//   - category: Optional category filter string.
//
// Return:
//   - Promise<VaultEntry[]>: Decrypted matching entries.
// ----------------------------------------------------------------------------
export async function searchEntries(query: string, category?: string): Promise<VaultEntry[]> {
  return await invoke<VaultEntry[]>("search_entries", { query, category: category || null });
}

// ----------------------------------------------------------------------------
// 13. searchEntryHeaders
// - Fast unencrypted database query across titles and categories.
//
// Args:
//   - query: Free-text search term.
//   - category: Optional category filter string.
//
// Return:
//   - Promise<VaultEntryHeader[]>: Matching entry header summaries.
// ----------------------------------------------------------------------------
export async function searchEntryHeaders(query: string, category?: string): Promise<VaultEntryHeader[]> {
  return await invoke<VaultEntryHeader[]>("search_entry_headers", { query, category: category || null });
}
