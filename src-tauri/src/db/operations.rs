// ============================================================================
// File: operations.rs
// Description: Core CRUD operations, master key verification, payload
//              encryption/decryption, and search for BigKey local database.
// ============================================================================

use std::time::{SystemTime, UNIX_EPOCH};
use rusqlite::{params, Connection, OptionalExtension};
use serde::Serialize;

use crate::crypto::{cipher, CryptoError, KdfParams};
use crate::models::{CustomField, VaultEntry, VaultEntryHeader, VaultItemPayload};
use super::error::DbError;
use super::schema::{SCHEMA_VERSION, VERIFIER_TOKEN_V1};

// Internal borrowed payload structure to serialize dynamic fields without heap cloning.
#[derive(Serialize)]
struct VaultItemPayloadRef<'a> {
    fields: &'a [CustomField],
    notes: Option<&'a str>,
}

// Helper: Retrieves current UTC Unix timestamp in seconds using standard library.
fn current_unix_timestamp() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}

// ----------------------------------------------------------------------------
// 1. is_vault_initialized
// - Checks whether a Master Password has already been set up in the database.
//
// Args:
//   - conn: An open rusqlite Connection reference.
//
// Return:
//   - Result<bool, DbError>: True if vault_meta record exists, false otherwise.
// ----------------------------------------------------------------------------
pub fn is_vault_initialized(conn: &Connection) -> Result<bool, DbError> {
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM vault_meta WHERE id = 1")?;
    let count: i64 = stmt.query_row([], |row| row.get(0))?;
    Ok(count > 0)
}

// ----------------------------------------------------------------------------
// 2. initialize_vault
// - Stores initial vault metadata (salt, verifier token, KDF params, schema).
//
// Args:
//   - conn: An open rusqlite Connection reference.
//   - master_key: A 32-byte derived master key reference.
//   - salt: A 16-byte random cryptographic salt array reference.
//   - params: The KdfParams used to derive the master key.
//
// Return:
//   - Result<(), DbError>: Ok on successful initialization, or error if already exists.
// ----------------------------------------------------------------------------
pub fn initialize_vault(
    conn: &Connection,
    master_key: &[u8; 32],
    salt: &[u8; 16],
    params: &KdfParams,
) -> Result<(), DbError> {
    // Step 1. Guard against duplicate initialization
    if is_vault_initialized(conn)? {
        return Err(DbError::VaultAlreadyInitialized);
    }

    // Step 2. Encrypt known verifier token using master key
    let verifier = cipher::encrypt(master_key, VERIFIER_TOKEN_V1)?;

    // Step 3. Persist singleton metadata record with KDF parameters
    let now = current_unix_timestamp();
    conn.execute(
        "INSERT INTO vault_meta (id, salt, verifier, kdf_memory, kdf_iterations, kdf_parallelism, schema_version, created_at)
         VALUES (1, ?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            salt.as_slice(),
            verifier,
            params.memory_kib,
            params.iterations,
            params.parallelism,
            SCHEMA_VERSION,
            now
        ],
    )?;

    Ok(())
}

// ----------------------------------------------------------------------------
// 3. get_vault_salt
// - Retrieves the 16-byte KDF salt from vault metadata.
//
// Args:
//   - conn: An open rusqlite Connection reference.
//
// Return:
//   - Result<[u8; 16], DbError>: The 16-byte cryptographic salt array.
// ----------------------------------------------------------------------------
pub fn get_vault_salt(conn: &Connection) -> Result<[u8; 16], DbError> {
    let mut stmt = conn.prepare("SELECT salt FROM vault_meta WHERE id = 1")?;
    let salt_vec: Option<Vec<u8>> = stmt.query_row([], |row| row.get(0)).optional()?;

    match salt_vec {
        Some(bytes) if bytes.len() == 16 => {
            let mut salt = [0u8; 16];
            salt.copy_from_slice(&bytes);
            Ok(salt)
        }
        Some(_) => Err(DbError::CryptoError(CryptoError::PayloadTooShort)),
        None => Err(DbError::VaultUninitialized),
    }
}

// ----------------------------------------------------------------------------
// 4. get_vault_kdf_params
// - Retrieves the Argon2id KDF parameters stored with this vault.
//
// Args:
//   - conn: An open rusqlite Connection reference.
//
// Return:
//   - Result<KdfParams, DbError>: The KdfParams record for this vault.
// ----------------------------------------------------------------------------
pub fn get_vault_kdf_params(conn: &Connection) -> Result<KdfParams, DbError> {
    let mut stmt = conn.prepare(
        "SELECT kdf_memory, kdf_iterations, kdf_parallelism FROM vault_meta WHERE id = 1",
    )?;
    let params_opt = stmt
        .query_row([], |row| {
            Ok(KdfParams {
                memory_kib: row.get(0)?,
                iterations: row.get(1)?,
                parallelism: row.get(2)?,
            })
        })
        .optional()?;

    match params_opt {
        Some(p) => Ok(p),
        None => Err(DbError::VaultUninitialized),
    }
}

// ----------------------------------------------------------------------------
// 5. verify_master_key
// - Validates candidate master key by decrypting the stored verifier envelope.
//
// Args:
//   - conn: An open rusqlite Connection reference.
//   - candidate_key: A 32-byte candidate key to test against the verifier.
//
// Return:
//   - Result<bool, DbError>: True if key decrypts and matches verifier, false otherwise.
// ----------------------------------------------------------------------------
pub fn verify_master_key(conn: &Connection, candidate_key: &[u8; 32]) -> Result<bool, DbError> {
    let mut stmt = conn.prepare("SELECT verifier FROM vault_meta WHERE id = 1")?;
    let verifier_opt: Option<Vec<u8>> = stmt.query_row([], |row| row.get(0)).optional()?;

    let verifier_bytes = match verifier_opt {
        Some(v) => v,
        None => return Err(DbError::VaultUninitialized),
    };

    // Step 1. Attempt decrypting the verifier envelope
    match cipher::decrypt(candidate_key, &verifier_bytes) {
        Ok(decrypted) => Ok(&*decrypted == VERIFIER_TOKEN_V1),
        Err(CryptoError::DecryptionFailed) => Ok(false),
        Err(e) => Err(DbError::CryptoError(e)),
    }
}

// ----------------------------------------------------------------------------
// 6. create_entry
// - Encrypts and persists a new dynamic vault item into SQLite database.
//
// Args:
//   - conn: An open rusqlite Connection reference.
//   - master_key: A 32-byte derived master key reference.
//   - entry: The in-memory VaultEntry containing fields and metadata.
//
// Return:
//   - Result<(), DbError>: Ok on successful insertion.
// ----------------------------------------------------------------------------
pub fn create_entry(
    conn: &Connection,
    master_key: &[u8; 32],
    entry: &VaultEntry,
) -> Result<(), DbError> {
    // Step 1. Assemble sensitive payload reference (zero-copy borrow)
    let payload = VaultItemPayloadRef {
        fields: &entry.fields,
        notes: entry.notes.as_deref(),
    };

    // Step 2. Serialize payload to JSON and encrypt into AEAD envelope BLOB
    let json_bytes = serde_json::to_vec(&payload)?;
    let encrypted_data = cipher::encrypt(master_key, &json_bytes)?;

    // Step 3. Insert record into database
    let is_fav_int = if entry.is_favorite { 1 } else { 0 };
    conn.execute(
        "INSERT INTO entries (id, title, category, is_favorite, encrypted_data, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            entry.id,
            entry.title,
            entry.category,
            is_fav_int,
            encrypted_data,
            entry.created_at,
            entry.updated_at
        ],
    )?;

    Ok(())
}

// ----------------------------------------------------------------------------
// 7. get_entry_by_id
// - Retrieves and decrypts a single vault item by its unique ID.
//
// Args:
//   - conn: An open rusqlite Connection reference.
//   - master_key: A 32-byte derived master key reference.
//   - id: Unique item identifier string slice.
//
// Return:
//   - Result<Option<VaultEntry>, DbError>: Decrypted VaultEntry if found, None otherwise.
// ----------------------------------------------------------------------------
pub fn get_entry_by_id(
    conn: &Connection,
    master_key: &[u8; 32],
    id: &str,
) -> Result<Option<VaultEntry>, DbError> {
    let mut stmt = conn.prepare(
        "SELECT id, title, category, is_favorite, encrypted_data, created_at, updated_at
         FROM entries WHERE id = ?1",
    )?;

    let row_data = stmt.query_row(params![id], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, i64>(3)?,
            row.get::<_, Vec<u8>>(4)?,
            row.get::<_, i64>(5)?,
            row.get::<_, i64>(6)?,
        ))
    }).optional()?;

    let (item_id, title, category, is_fav, encrypted_data, created_at, updated_at) = match row_data {
        Some(tuple) => tuple,
        None => return Ok(None),
    };

    // Step 1. Decrypt envelope payload and deserialize JSON
    let decrypted_bytes = cipher::decrypt(master_key, &encrypted_data)?;
    let mut payload: VaultItemPayload = serde_json::from_slice(&decrypted_bytes)?;

    Ok(Some(VaultEntry {
        id: item_id,
        title,
        category,
        is_favorite: is_fav == 1,
        fields: std::mem::take(&mut payload.fields),
        notes: payload.notes.take(),
        created_at,
        updated_at,
    }))
}

// ----------------------------------------------------------------------------
// 8. list_entry_headers
// - Retrieves lightweight summary headers for all entries without decrypting payloads.
//
// Args:
//   - conn: An open rusqlite Connection reference.
//
// Return:
//   - Result<Vec<VaultEntryHeader>, DbError>: List of entry headers ordered by favorite and update time.
// ----------------------------------------------------------------------------
pub fn list_entry_headers(conn: &Connection) -> Result<Vec<VaultEntryHeader>, DbError> {
    let mut stmt = conn.prepare(
        "SELECT id, title, category, is_favorite, updated_at
         FROM entries ORDER BY is_favorite DESC, updated_at DESC",
    )?;

    let rows = stmt.query_map([], |row| {
        let is_fav: i64 = row.get(3)?;
        Ok(VaultEntryHeader {
            id: row.get(0)?,
            title: row.get(1)?,
            category: row.get(2)?,
            is_favorite: is_fav == 1,
            updated_at: row.get(4)?,
        })
    })?;

    let mut headers = Vec::new();
    for row in rows {
        headers.push(row?);
    }

    Ok(headers)
}

// ----------------------------------------------------------------------------
// 9. list_entries
// - Retrieves and decrypts all vault entries, ordered by most recently updated.
//
// Args:
//   - conn: An open rusqlite Connection reference.
//   - master_key: A 32-byte derived master key reference.
//
// Return:
//   - Result<Vec<VaultEntry>, DbError>: List of all decrypted vault entries.
// ----------------------------------------------------------------------------
pub fn list_entries(conn: &Connection, master_key: &[u8; 32]) -> Result<Vec<VaultEntry>, DbError> {
    let mut stmt = conn.prepare(
        "SELECT id, title, category, is_favorite, encrypted_data, created_at, updated_at
         FROM entries ORDER BY is_favorite DESC, updated_at DESC",
    )?;

    let rows = stmt.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, i64>(3)?,
            row.get::<_, Vec<u8>>(4)?,
            row.get::<_, i64>(5)?,
            row.get::<_, i64>(6)?,
        ))
    })?;

    let mut entries = Vec::new();
    for row in rows {
        let (id, title, category, is_fav, encrypted_data, created_at, updated_at) = row?;
        let decrypted_bytes = cipher::decrypt(master_key, &encrypted_data)?;
        let mut payload: VaultItemPayload = serde_json::from_slice(&decrypted_bytes)?;

        entries.push(VaultEntry {
            id,
            title,
            category,
            is_favorite: is_fav == 1,
            fields: std::mem::take(&mut payload.fields),
            notes: payload.notes.take(),
            created_at,
            updated_at,
        });
    }

    Ok(entries)
}

// ----------------------------------------------------------------------------
// 10. update_entry
// - Re-encrypts payload and updates an existing entry in the database.
//
// Args:
//   - conn: An open rusqlite Connection reference.
//   - master_key: A 32-byte derived master key reference.
//   - entry: The updated in-memory VaultEntry reference.
//
// Return:
//   - Result<(), DbError>: Ok on successful update, or EntryNotFound if no row matched.
// ----------------------------------------------------------------------------
pub fn update_entry(
    conn: &Connection,
    master_key: &[u8; 32],
    entry: &VaultEntry,
) -> Result<(), DbError> {
    // Step 1. Assemble sensitive payload reference and re-encrypt (zero-copy borrow)
    let payload = VaultItemPayloadRef {
        fields: &entry.fields,
        notes: entry.notes.as_deref(),
    };
    let json_bytes = serde_json::to_vec(&payload)?;
    let encrypted_data = cipher::encrypt(master_key, &json_bytes)?;

    // Step 2. Update record in SQLite
    let is_fav_int = if entry.is_favorite { 1 } else { 0 };
    let rows_affected = conn.execute(
        "UPDATE entries
         SET title = ?1, category = ?2, is_favorite = ?3, encrypted_data = ?4, updated_at = ?5
         WHERE id = ?6",
        params![
            entry.title,
            entry.category,
            is_fav_int,
            encrypted_data,
            entry.updated_at,
            entry.id
        ],
    )?;

    if rows_affected == 0 {
        return Err(DbError::EntryNotFound(entry.id.clone()));
    }

    Ok(())
}

// ----------------------------------------------------------------------------
// 11. delete_entry
// - Deletes an entry from SQLite database by its ID.
//
// Args:
//   - conn: An open rusqlite Connection reference.
//   - id: Unique item identifier string slice.
//
// Return:
//   - Result<bool, DbError>: True if record was found and deleted, false otherwise.
// ----------------------------------------------------------------------------
pub fn delete_entry(conn: &Connection, id: &str) -> Result<bool, DbError> {
    let rows_affected = conn.execute("DELETE FROM entries WHERE id = ?1", params![id])?;
    Ok(rows_affected > 0)
}

// ----------------------------------------------------------------------------
// 12. toggle_favorite
// - Toggles the favorite status of a vault entry.
//
// Args:
//   - conn: An open rusqlite Connection reference.
//   - id: Unique item identifier string slice.
//
// Return:
//   - Result<bool, DbError>: Returns the new boolean favorite status.
// ----------------------------------------------------------------------------
pub fn toggle_favorite(conn: &Connection, id: &str) -> Result<bool, DbError> {
    let current_fav: Option<i64> = conn
        .query_row("SELECT is_favorite FROM entries WHERE id = ?1", params![id], |row| row.get(0))
        .optional()?;

    let current = match current_fav {
        Some(val) => val,
        None => return Err(DbError::EntryNotFound(id.to_string())),
    };

    let next = if current == 1 { 0 } else { 1 };
    let now = current_unix_timestamp();
    conn.execute(
        "UPDATE entries SET is_favorite = ?1, updated_at = ?2 WHERE id = ?3",
        params![next, now, id],
    )?;

    Ok(next == 1)
}

// ----------------------------------------------------------------------------
// 13. search_entries
// - Searches entries across titles, categories, and decrypted custom field values.
//
// Args:
//   - conn: An open rusqlite Connection reference.
//   - master_key: A 32-byte derived master key reference.
//   - query: Free-text search term string slice.
//   - category: Optional category filter string slice.
//
// Return:
//   - Result<Vec<VaultEntry>, DbError>: Filtered list of matching decrypted entries.
// ----------------------------------------------------------------------------
pub fn search_entries(
    conn: &Connection,
    master_key: &[u8; 32],
    query: &str,
    category: Option<&str>,
) -> Result<Vec<VaultEntry>, DbError> {
    // Step 1. Retrieve all entries from database
    let all = list_entries(conn, master_key)?;
    let query_lower = query.trim().to_lowercase();

    // Step 2. Filter in-memory against query term and category
    let filtered = all
        .into_iter()
        .filter(|entry| {
            if let Some(cat) = category {
                if !entry.category.eq_ignore_ascii_case(cat) {
                    return false;
                }
            }

            if query_lower.is_empty() {
                return true;
            }

            // Match title
            if entry.title.to_lowercase().contains(&query_lower) {
                return true;
            }

            // Match notes
            if let Some(ref note) = entry.notes {
                if note.to_lowercase().contains(&query_lower) {
                    return true;
                }
            }

            // Match any field label or value
            for field in &entry.fields {
                if field.label.to_lowercase().contains(&query_lower)
                    || field.value.to_lowercase().contains(&query_lower)
                {
                    return true;
                }
            }

            false
        })
        .collect();

    Ok(filtered)
}

// ----------------------------------------------------------------------------
// 14. search_entry_headers
// - Searches lightweight entry headers by title and category without decryption.
//
// Args:
//   - conn: An open rusqlite Connection reference.
//   - query: Substring to match against title.
//   - category: Optional category filter string slice.
//
// Return:
//   - Result<Vec<VaultEntryHeader>, DbError>: Matching entry headers.
// ----------------------------------------------------------------------------
pub fn search_entry_headers(
    conn: &Connection,
    query: &str,
    category: Option<&str>,
) -> Result<Vec<VaultEntryHeader>, DbError> {
    let query_trim = query.trim();
    let mut stmt = conn.prepare(
        "SELECT id, title, category, is_favorite, updated_at
         FROM entries
         WHERE (?1 IS NULL OR category = ?1)
           AND (?2 = '' OR title LIKE '%' || ?2 || '%')
         ORDER BY is_favorite DESC, updated_at DESC",
    )?;

    let rows = stmt.query_map(params![category, query_trim], |row| {
        let is_fav: i64 = row.get(3)?;
        Ok(VaultEntryHeader {
            id: row.get(0)?,
            title: row.get(1)?,
            category: row.get(2)?,
            is_favorite: is_fav == 1,
            updated_at: row.get(4)?,
        })
    })?;

    let mut headers = Vec::new();
    for row in rows {
        headers.push(row?);
    }

    Ok(headers)
}

