// ============================================================================
// File: entries.rs
// Description: Vault entry CRUD, search, and lightweight header listing IPC
//              commands guarded by active session validation and auto-lock check.
// ============================================================================

use tauri::State;

use crate::db;
use crate::models::{VaultEntry, VaultEntryHeader};
use super::error::CommandError;
use super::state::AppState;

// ----------------------------------------------------------------------------
// 1. exec_list_entry_headers
// - Core execution logic for querying entry headers without decryption overhead.
//
// Args:
//   - state: Shared AppState reference.
//
// Return:
//   - Result<Vec<VaultEntryHeader>, CommandError>: List of entry headers if unlocked.
// ----------------------------------------------------------------------------
pub async fn exec_list_entry_headers(state: &AppState) -> Result<Vec<VaultEntryHeader>, CommandError> {
    // Step 1. Guard against locked or expired session
    let _key = state.get_active_session_key()?;

    // Step 2. Query SQLite for headers sorted by favorite and updated timestamp
    let conn = state.db.lock().map_err(|e| CommandError::InternalError(e.to_string()))?;
    let headers = db::list_entry_headers(&conn)?;

    Ok(headers)
}

// ----------------------------------------------------------------------------
// 2. list_entry_headers
// - Tauri IPC command wrapper for listing lightweight card headers.
//
// Args:
//   - state: Managed Tauri AppState injection.
//
// Return:
//   - Result<Vec<VaultEntryHeader>, CommandError>: List of headers for Dashboard.
// ----------------------------------------------------------------------------
#[tauri::command]
pub async fn list_entry_headers(state: State<'_, AppState>) -> Result<Vec<VaultEntryHeader>, CommandError> {
    exec_list_entry_headers(&state).await
}

// ----------------------------------------------------------------------------
// 3. exec_get_entry
// - Retrieves and decrypts a specific entry payload by its unique ID.
//
// Args:
//   - state: Shared AppState reference.
//   - id: Unique entry identifier string.
//
// Return:
//   - Result<Option<VaultEntry>, CommandError>: Decrypted entry or None if not found.
// ----------------------------------------------------------------------------
pub async fn exec_get_entry(state: &AppState, id: String) -> Result<Option<VaultEntry>, CommandError> {
    // Step 1. Guard against locked or expired session and retrieve master key
    let key = state.get_active_session_key()?;

    // Step 2. Retrieve row from SQLite and decrypt payload
    let conn = state.db.lock().map_err(|e| CommandError::InternalError(e.to_string()))?;
    let entry = db::get_entry_by_id(&conn, &key, &id)?;

    Ok(entry)
}

// ----------------------------------------------------------------------------
// 4. get_entry
// - Tauri IPC command wrapper for retrieving and decrypting a single entry.
//
// Args:
//   - state: Managed Tauri AppState injection.
//   - id: Unique entry identifier string.
//
// Return:
//   - Result<Option<VaultEntry>, CommandError>: Decrypted entry or None if not found.
// ----------------------------------------------------------------------------
#[tauri::command]
pub async fn get_entry(state: State<'_, AppState>, id: String) -> Result<Option<VaultEntry>, CommandError> {
    exec_get_entry(&state, id).await
}

// ----------------------------------------------------------------------------
// 5. exec_create_entry
// - Encrypts and persists a new vault item in the database.
//
// Args:
//   - state: Shared AppState reference.
//   - entry: The in-memory VaultEntry containing custom fields and metadata.
//
// Return:
//   - Result<(), CommandError>: Ok on successful encryption and insertion.
// ----------------------------------------------------------------------------
pub async fn exec_create_entry(state: &AppState, entry: VaultEntry) -> Result<(), CommandError> {
    // Step 1. Guard session and retrieve master key
    let key = state.get_active_session_key()?;

    // Step 2. Encrypt dynamic fields and persist into SQLite
    let conn = state.db.lock().map_err(|e| CommandError::InternalError(e.to_string()))?;
    db::create_entry(&conn, &key, &entry)?;

    Ok(())
}

// ----------------------------------------------------------------------------
// 6. create_entry
// - Tauri IPC command wrapper for creating a new vault entry.
//
// Args:
//   - state: Managed Tauri AppState injection.
//   - entry: The in-memory VaultEntry containing custom fields and metadata.
//
// Return:
//   - Result<(), CommandError>: Ok on successful creation.
// ----------------------------------------------------------------------------
#[tauri::command]
pub async fn create_entry(state: State<'_, AppState>, entry: VaultEntry) -> Result<(), CommandError> {
    exec_create_entry(&state, entry).await
}

// ----------------------------------------------------------------------------
// 7. exec_update_entry
// - Re-encrypts payload and updates an existing entry in the database.
//
// Args:
//   - state: Shared AppState reference.
//   - entry: The updated in-memory VaultEntry reference.
//
// Return:
//   - Result<(), CommandError>: Ok on successful update, or EntryNotFound.
// ----------------------------------------------------------------------------
pub async fn exec_update_entry(state: &AppState, entry: VaultEntry) -> Result<(), CommandError> {
    // Step 1. Guard session and retrieve master key
    let key = state.get_active_session_key()?;

    // Step 2. Re-encrypt payload and update record in SQLite
    let conn = state.db.lock().map_err(|e| CommandError::InternalError(e.to_string()))?;
    db::update_entry(&conn, &key, &entry)?;

    Ok(())
}

// ----------------------------------------------------------------------------
// 8. update_entry
// - Tauri IPC command wrapper for updating an existing vault entry.
//
// Args:
//   - state: Managed Tauri AppState injection.
//   - entry: The updated in-memory VaultEntry reference.
//
// Return:
//   - Result<(), CommandError>: Ok on successful update.
// ----------------------------------------------------------------------------
#[tauri::command]
pub async fn update_entry(state: State<'_, AppState>, entry: VaultEntry) -> Result<(), CommandError> {
    exec_update_entry(&state, entry).await
}

// ----------------------------------------------------------------------------
// 9. exec_delete_entry
// - Deletes an entry from SQLite by its unique ID.
//
// Args:
//   - state: Shared AppState reference.
//   - id: Unique entry identifier string.
//
// Return:
//   - Result<bool, CommandError>: True if entry was deleted, false if not found.
// ----------------------------------------------------------------------------
pub async fn exec_delete_entry(state: &AppState, id: String) -> Result<bool, CommandError> {
    // Step 1. Guard session
    let _key = state.get_active_session_key()?;

    // Step 2. Delete entry row in SQLite
    let conn = state.db.lock().map_err(|e| CommandError::InternalError(e.to_string()))?;
    let deleted = db::delete_entry(&conn, &id)?;

    Ok(deleted)
}

// ----------------------------------------------------------------------------
// 10. delete_entry
// - Tauri IPC command wrapper for deleting a vault entry.
//
// Args:
//   - state: Managed Tauri AppState injection.
//   - id: Unique entry identifier string.
//
// Return:
//   - Result<bool, CommandError>: True if entry was deleted, false if not found.
// ----------------------------------------------------------------------------
#[tauri::command]
pub async fn delete_entry(state: State<'_, AppState>, id: String) -> Result<bool, CommandError> {
    exec_delete_entry(&state, id).await
}

// ----------------------------------------------------------------------------
// 11. exec_toggle_favorite
// - Toggles the favorite status of a vault entry.
//
// Args:
//   - state: Shared AppState reference.
//   - id: Unique entry identifier string.
//
// Return:
//   - Result<bool, CommandError>: Returns the new boolean favorite status.
// ----------------------------------------------------------------------------
pub async fn exec_toggle_favorite(state: &AppState, id: String) -> Result<bool, CommandError> {
    // Step 1. Guard session
    let _key = state.get_active_session_key()?;

    // Step 2. Toggle favorite integer in SQLite
    let conn = state.db.lock().map_err(|e| CommandError::InternalError(e.to_string()))?;
    let new_fav = db::toggle_favorite(&conn, &id)?;

    Ok(new_fav)
}

// ----------------------------------------------------------------------------
// 12. toggle_favorite
// - Tauri IPC command wrapper for toggling favorite flag on an entry.
//
// Args:
//   - state: Managed Tauri AppState injection.
//   - id: Unique entry identifier string.
//
// Return:
//   - Result<bool, CommandError>: Returns the new boolean favorite status.
// ----------------------------------------------------------------------------
#[tauri::command]
pub async fn toggle_favorite(state: State<'_, AppState>, id: String) -> Result<bool, CommandError> {
    exec_toggle_favorite(&state, id).await
}

// ----------------------------------------------------------------------------
// 13. exec_search_entries
// - Performs in-memory deep search across titles, categories, and field values.
//
// Args:
//   - state: Shared AppState reference.
//   - query: Free-text search term string.
//   - category: Optional category filter string.
//
// Return:
//   - Result<Vec<VaultEntry>, CommandError>: Matching decrypted entries.
// ----------------------------------------------------------------------------
pub async fn exec_search_entries(
    state: &AppState,
    query: String,
    category: Option<String>,
) -> Result<Vec<VaultEntry>, CommandError> {
    // Step 1. Guard session and retrieve master key
    let key = state.get_active_session_key()?;

    // Step 2. Search entries in SQLite
    let conn = state.db.lock().map_err(|e| CommandError::InternalError(e.to_string()))?;
    let results = db::search_entries(&conn, &key, &query, category.as_deref())?;

    Ok(results)
}

// ----------------------------------------------------------------------------
// 14. search_entries
// - Tauri IPC command wrapper for searching vault items.
//
// Args:
//   - state: Managed Tauri AppState injection.
//   - query: Free-text search term string.
//   - category: Optional category filter string.
//
// Return:
//   - Result<Vec<VaultEntry>, CommandError>: Matching decrypted entries.
// ----------------------------------------------------------------------------
#[tauri::command]
pub async fn search_entries(
    state: State<'_, AppState>,
    query: String,
    category: Option<String>,
) -> Result<Vec<VaultEntry>, CommandError> {
    exec_search_entries(&state, query, category).await
}

// ----------------------------------------------------------------------------
// 15. exec_search_entry_headers
// - Performs fast SQL search across titles and categories without decryption.
//
// Args:
//   - state: Shared AppState reference.
//   - query: Free-text search term string.
//   - category: Optional category filter string.
//
// Return:
//   - Result<Vec<VaultEntryHeader>, CommandError>: Matching entry headers.
// ----------------------------------------------------------------------------
pub async fn exec_search_entry_headers(
    state: &AppState,
    query: String,
    category: Option<String>,
) -> Result<Vec<VaultEntryHeader>, CommandError> {
    // Step 1. Guard session
    let _key = state.get_active_session_key()?;

    // Step 2. Search entry headers in SQLite without decrypting payload
    let conn = state.db.lock().map_err(|e| CommandError::InternalError(e.to_string()))?;
    let results = db::search_entry_headers(&conn, &query, category.as_deref())?;

    Ok(results)
}

// ----------------------------------------------------------------------------
// 16. search_entry_headers
// - Tauri IPC command wrapper for fast header-only search without decryption.
//
// Args:
//   - state: Managed Tauri AppState injection.
//   - query: Free-text search term string.
//   - category: Optional category filter string.
//
// Return:
//   - Result<Vec<VaultEntryHeader>, CommandError>: Matching entry headers.
// ----------------------------------------------------------------------------
#[tauri::command]
pub async fn search_entry_headers(
    state: State<'_, AppState>,
    query: String,
    category: Option<String>,
) -> Result<Vec<VaultEntryHeader>, CommandError> {
    exec_search_entry_headers(&state, query, category).await
}

