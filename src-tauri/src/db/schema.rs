// ============================================================================
// File: schema.rs
// Description: SQLite schema definitions, DDL execution, and vault verifier
//              constants for BigKey password manager.
// ============================================================================

use rusqlite::Connection;

use super::error::DbError;

pub const VERIFIER_TOKEN_V1: &[u8] = b"BIGKEY_VAULT_VERIFIER_TOKEN_V1";
pub const SCHEMA_VERSION: i32 = 1;

// ----------------------------------------------------------------------------
// 1. init_schema
// - Initializes database tables and indices for vault metadata and entries.
//
// Args:
//   - conn: An open rusqlite Connection reference.
//
// Return:
//   - Result<(), DbError>: Ok if tables and indices are successfully created.
// ----------------------------------------------------------------------------
pub fn init_schema(conn: &Connection) -> Result<(), DbError> {
    // Step 1. Configure SQLite pragmas for integrity and mobile crash resiliency
    conn.execute_batch(
        "PRAGMA foreign_keys = ON;
         PRAGMA journal_mode = WAL;",
    )?;

    // Step 2. Create singleton vault_meta table and dynamic entries table
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS vault_meta (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            salt BLOB NOT NULL,
            verifier BLOB NOT NULL,
            kdf_memory INTEGER NOT NULL,
            kdf_iterations INTEGER NOT NULL,
            kdf_parallelism INTEGER NOT NULL,
            schema_version INTEGER NOT NULL,
            created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS entries (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            is_favorite INTEGER NOT NULL DEFAULT 0,
            encrypted_data BLOB NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_entries_category ON entries(category);
        CREATE INDEX IF NOT EXISTS idx_entries_updated_at ON entries(updated_at DESC);
        CREATE INDEX IF NOT EXISTS idx_entries_is_favorite ON entries(is_favorite);",
    )?;

    Ok(())
}
