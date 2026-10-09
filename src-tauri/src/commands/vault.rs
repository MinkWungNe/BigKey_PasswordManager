// ============================================================================
// File: vault.rs
// Description: Vault lifecycle IPC commands: status query, initialization,
//              argon2id CPU offloading, unlock verification, and lock purge.
// ============================================================================

use tauri::State;
use zeroize::Zeroizing;

use crate::crypto::{kdf, KdfParams};
use crate::db;
use crate::models::VaultStatus;
use super::error::CommandError;
use super::state::AppState;

// ----------------------------------------------------------------------------
// 1. exec_get_vault_status
// - Core execution logic for querying vault initialization and unlock state.
//
// Args:
//   - state: Shared AppState reference.
//
// Return:
//   - Result<VaultStatus, CommandError>: Current vault lifecycle status.
// ----------------------------------------------------------------------------
pub async fn exec_get_vault_status(state: &AppState) -> Result<VaultStatus, CommandError> {
    // Step 1. Check if database has been initialized with metadata
    let conn = state.db.lock().map_err(|e| CommandError::InternalError(e.to_string()))?;
    let is_initialized = db::is_vault_initialized(&conn)?;
    drop(conn);

    // Step 2. Verify active session in memory and purge if expired
    let is_unlocked = if is_initialized {
        state.check_unlocked_and_cleanup()
    } else {
        false
    };

    Ok(VaultStatus {
        is_initialized,
        is_unlocked,
    })
}

// ----------------------------------------------------------------------------
// 2. get_vault_status
// - Tauri IPC command wrapper for querying vault status.
//
// Args:
//   - state: Managed Tauri AppState injection.
//
// Return:
//   - Result<VaultStatus, CommandError>: Current vault lifecycle status.
// ----------------------------------------------------------------------------
#[tauri::command]
pub async fn get_vault_status(state: State<'_, AppState>) -> Result<VaultStatus, CommandError> {
    exec_get_vault_status(&state).await
}

// ----------------------------------------------------------------------------
// 3. exec_init_vault
// - Derives master key via background worker and initializes vault metadata.
//
// Args:
//   - state: Shared AppState reference.
//   - master_password: User-provided master password in zeroizing memory wrapper.
//
// Return:
//   - Result<(), CommandError>: Ok on successful initialization and unlock.
// ----------------------------------------------------------------------------
pub async fn exec_init_vault(
    state: &AppState,
    master_password: Zeroizing<String>,
) -> Result<(), CommandError> {
    // Step 1. Verify vault is not already initialized
    {
        let conn = state.db.lock().map_err(|e| CommandError::InternalError(e.to_string()))?;
        if db::is_vault_initialized(&conn)? {
            return Err(CommandError::VaultAlreadyInitialized);
        }
    }

    // Step 2. Generate random salt, default KDF parameters, and offload Argon2id derivation
    let salt = kdf::generate_salt();
    let default_params = KdfParams::default();

    let master_key = tauri::async_runtime::spawn_blocking(move || {
        kdf::derive_key(master_password, &salt)
    })
    .await
    .map_err(|e| CommandError::InternalError(e.to_string()))??;

    // Step 3. Persist metadata and verifier envelope into SQLite
    {
        let conn = state.db.lock().map_err(|e| CommandError::InternalError(e.to_string()))?;
        if db::is_vault_initialized(&conn)? {
            return Err(CommandError::VaultAlreadyInitialized);
        }
        db::initialize_vault(&conn, &master_key, &salt, &default_params)?;
    }

    // Step 4. Unlock session in memory with the newly derived key
    let mut session = state.session.write().unwrap();
    session.unlock(master_key);

    Ok(())
}

// ----------------------------------------------------------------------------
// 4. init_vault
// - Tauri IPC command wrapper for vault setup and initial master key creation.
//
// Args:
//   - state: Managed Tauri AppState injection.
//   - master_password: User-provided master password string.
//
// Return:
//   - Result<(), CommandError>: Ok on successful initialization.
// ----------------------------------------------------------------------------
#[tauri::command]
pub async fn init_vault(
    state: State<'_, AppState>,
    master_password: Zeroizing<String>,
) -> Result<(), CommandError> {
    exec_init_vault(&state, master_password).await
}

// ----------------------------------------------------------------------------
// 5. exec_unlock_vault
// - Offloads Argon2id derivation and validates candidate key against verifier.
//
// Args:
//   - state: Shared AppState reference.
//   - master_password: Candidate master password in zeroizing memory wrapper.
//
// Return:
//   - Result<(), CommandError>: Ok on successful unlock, or InvalidMasterPassword.
// ----------------------------------------------------------------------------
pub async fn exec_unlock_vault(
    state: &AppState,
    master_password: Zeroizing<String>,
) -> Result<(), CommandError> {
    // Step 1. Retrieve stored salt and KDF parameters from SQLite
    let (salt, kdf_params) = {
        let conn = state.db.lock().map_err(|e| CommandError::InternalError(e.to_string()))?;
        if !db::is_vault_initialized(&conn)? {
            return Err(CommandError::VaultUninitialized);
        }
        let s = db::get_vault_salt(&conn)?;
        let p = db::get_vault_kdf_params(&conn)?;
        (s, p)
    };

    // Step 2. Offload heavy Argon2id computation to background worker thread
    let candidate_key = tauri::async_runtime::spawn_blocking(move || {
        kdf::derive_key_with_params(master_password, &salt, &kdf_params)
    })
    .await
    .map_err(|e| CommandError::InternalError(e.to_string()))??;

    // Step 3. Re-acquire database lock and verify key against verifier token
    {
        let conn = state.db.lock().map_err(|e| CommandError::InternalError(e.to_string()))?;
        let is_valid = db::verify_master_key(&conn, &candidate_key)?;
        if !is_valid {
            return Err(CommandError::InvalidMasterPassword);
        }
    }

    // Step 4. Store validated key in memory and start session
    let mut session = state.session.write().unwrap();
    session.unlock(candidate_key);

    Ok(())
}

// ----------------------------------------------------------------------------
// 6. unlock_vault
// - Tauri IPC command wrapper for unlocking vault with master password.
//
// Args:
//   - state: Managed Tauri AppState injection.
//   - master_password: Candidate master password string.
//
// Return:
//   - Result<(), CommandError>: Ok on successful unlock.
// ----------------------------------------------------------------------------
#[tauri::command]
pub async fn unlock_vault(
    state: State<'_, AppState>,
    master_password: Zeroizing<String>,
) -> Result<(), CommandError> {
    exec_unlock_vault(&state, master_password).await
}

// ----------------------------------------------------------------------------
// 7. exec_lock_vault
// - Core execution logic for locking vault and zeroizing session key from RAM.
//
// Args:
//   - state: Shared AppState reference.
//
// Return:
//   - Result<(), CommandError>: Ok on successful lock.
// ----------------------------------------------------------------------------
pub async fn exec_lock_vault(state: &AppState) -> Result<(), CommandError> {
    let mut session = state.session.write().unwrap();
    session.lock();
    Ok(())
}

// ----------------------------------------------------------------------------
// 8. lock_vault
// - Tauri IPC command wrapper for immediate vault locking.
//
// Args:
//   - state: Managed Tauri AppState injection.
//
// Return:
//   - Result<(), CommandError>: Ok on successful lock.
// ----------------------------------------------------------------------------
#[tauri::command]
pub async fn lock_vault(state: State<'_, AppState>) -> Result<(), CommandError> {
    exec_lock_vault(&state).await
}

// ----------------------------------------------------------------------------
// 9. exec_reset_activity
// - Touches the session timer to extend auto-lock threshold upon user activity.
//
// Args:
//   - state: Shared AppState reference.
//
// Return:
//   - Result<(), CommandError>: Ok on successful refresh.
// ----------------------------------------------------------------------------
pub async fn exec_reset_activity(state: &AppState) -> Result<(), CommandError> {
    let mut session = state.session.write().unwrap();
    session.touch();
    Ok(())
}

// ----------------------------------------------------------------------------
// 10. reset_activity
// - Tauri IPC command wrapper for refreshing auto-lock activity timer.
//
// Args:
//   - state: Managed Tauri AppState injection.
//
// Return:
//   - Result<(), CommandError>: Ok on successful refresh.
// ----------------------------------------------------------------------------
#[tauri::command]
pub async fn reset_activity(state: State<'_, AppState>) -> Result<(), CommandError> {
    exec_reset_activity(&state).await
}
