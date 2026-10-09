// ============================================================================
// File: index.ts
// Description: Frontend TypeScript type definitions for vault entities and state.
// ============================================================================

export type FieldType = "text" | "concealed" | "note" | "url";

export interface CustomField {
  id: string;
  label: string;
  field_type: FieldType;
  value: string;
}

export interface VaultEntry {
  id: string;
  title: string;
  category: "login" | "card" | "note" | "custom" | string;
  is_favorite: boolean;
  fields: CustomField[];
  notes?: string;
  created_at: number; // UTC Unix timestamp in seconds
  updated_at: number; // UTC Unix timestamp in seconds
}

export interface VaultEntryHeader {
  id: string;
  title: string;
  category: "login" | "card" | "note" | "custom" | string;
  is_favorite: boolean;
  updated_at: number; // UTC Unix timestamp in seconds
}

export interface VaultStatus {
  is_initialized: boolean;
  is_unlocked: boolean;
}
