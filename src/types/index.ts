// ============================================================================
// File: index.ts
// Description: Frontend TypeScript type definitions for vault entities and state.
// ============================================================================

export interface VaultEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  category: "login" | "note" | "card";
  created_at: number; // UTC Unix timestamp in seconds
  updated_at: number; // UTC Unix timestamp in seconds
}

export interface VaultStatus {
  is_initialized: boolean;
  is_unlocked: boolean;
}
