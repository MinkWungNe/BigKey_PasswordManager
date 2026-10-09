// ============================================================================
// File: mod.rs
// Description: Tauri IPC command module facade, exporting error types, state
//              management, lifecycle commands, and automated integration tests.
// ============================================================================

pub mod entries;
pub mod error;
pub mod state;
pub mod vault;

pub use entries::{
    create_entry, delete_entry, exec_create_entry, exec_delete_entry, exec_get_entry,
    exec_list_entry_headers, exec_search_entries, exec_search_entry_headers,
    exec_toggle_favorite, exec_update_entry, get_entry, list_entry_headers,
    search_entries, search_entry_headers, toggle_favorite, update_entry,
};
pub use error::CommandError;
pub use state::{AppState, VaultSession, DEFAULT_AUTO_LOCK_TIMEOUT_SECS};
pub use vault::{
    exec_get_vault_status, exec_init_vault, exec_lock_vault, exec_reset_activity,
    exec_unlock_vault, get_vault_status, init_vault, lock_vault, reset_activity, unlock_vault,
};

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;
    use zeroize::Zeroizing;
    use crate::db::init_schema;
    use crate::models::{CustomField, FieldType, VaultEntry};

    // Helper: Creates an in-memory database with schema initialized in AppState.
    fn setup_test_app_state(timeout_secs: u64) -> AppState {
        let conn = Connection::open_in_memory().expect("Failed to create in-memory db");
        init_schema(&conn).expect("Failed to initialize database schema");
        AppState::with_timeout(conn, timeout_secs)
    }

    #[test]
    fn test_vault_lifecycle_uninitialized_to_init_to_lock_to_unlock() {
        tauri::async_runtime::block_on(async {
            let state = setup_test_app_state(300);

            // 1. Initial state must be uninitialized and locked
            let status = exec_get_vault_status(&state).await.unwrap();
            assert!(!status.is_initialized);
            assert!(!status.is_unlocked);

            // 2. Initialize vault with master password
            exec_init_vault(&state, Zeroizing::new("SuperSecret123!".to_string())).await.unwrap();

            // After initialization, vault should be initialized and unlocked
            let status = exec_get_vault_status(&state).await.unwrap();
            assert!(status.is_initialized);
            assert!(status.is_unlocked);

            // Duplicate initialization must be rejected
            let dup_err = exec_init_vault(&state, Zeroizing::new("OtherPassword".to_string())).await;
            assert!(matches!(dup_err, Err(CommandError::VaultAlreadyInitialized)));

            // 3. Lock vault
            exec_lock_vault(&state).await.unwrap();
            let status = exec_get_vault_status(&state).await.unwrap();
            assert!(status.is_initialized);
            assert!(!status.is_unlocked);

            // 4. Unlock with correct password
            exec_unlock_vault(&state, Zeroizing::new("SuperSecret123!".to_string())).await.unwrap();
            let status = exec_get_vault_status(&state).await.unwrap();
            assert!(status.is_unlocked);
        });
    }

    #[test]
    fn test_unlock_with_wrong_password_fails() {
        tauri::async_runtime::block_on(async {
            let state = setup_test_app_state(300);
            exec_init_vault(&state, Zeroizing::new("CorrectPass999".to_string())).await.unwrap();
            exec_lock_vault(&state).await.unwrap();

            // Attempt unlocking with wrong password
            let res = exec_unlock_vault(&state, Zeroizing::new("WrongPass000".to_string())).await;
            assert!(matches!(res, Err(CommandError::InvalidMasterPassword)));

            // Status must remain locked
            let status = exec_get_vault_status(&state).await.unwrap();
            assert!(!status.is_unlocked);
        });
    }

    #[test]
    fn test_locked_vault_blocks_entries_access() {
        tauri::async_runtime::block_on(async {
            let state = setup_test_app_state(300);
            exec_init_vault(&state, Zeroizing::new("Pass123!".to_string())).await.unwrap();
            exec_lock_vault(&state).await.unwrap();

            // Attempting to list headers or get entry must fail with VaultLocked
            let list_res = exec_list_entry_headers(&state).await;
            assert!(matches!(list_res, Err(CommandError::VaultLocked)));

            let get_res = exec_get_entry(&state, "any-id".to_string()).await;
            assert!(matches!(get_res, Err(CommandError::VaultLocked)));
        });
    }

    #[test]
    fn test_crud_flow_guarded_by_active_session() {
        tauri::async_runtime::block_on(async {
            let state = setup_test_app_state(300);
            exec_init_vault(&state, Zeroizing::new("MasterPassKey".to_string())).await.unwrap();

            let entry = VaultEntry {
                id: "cmd-1".to_string(),
                title: "ProtonMail".to_string(),
                category: "login".to_string(),
                is_favorite: false,
                fields: vec![CustomField {
                    id: "f-1".to_string(),
                    label: "Username".to_string(),
                    field_type: FieldType::Text,
                    value: "user@proton.me".to_string(),
                }],
                notes: Some("Encrypted notes".to_string()),
                created_at: 1000,
                updated_at: 1000,
            };

            // Create entry
            exec_create_entry(&state, entry.clone()).await.unwrap();

            // Read header without decryption
            let headers = exec_list_entry_headers(&state).await.unwrap();
            assert_eq!(headers.len(), 1);
            assert_eq!(headers[0].title, "ProtonMail");
            assert!(!headers[0].is_favorite);

            // Read full entry with decryption
            let read_entry = exec_get_entry(&state, "cmd-1".to_string()).await.unwrap().unwrap();
            assert_eq!(read_entry.fields.len(), 1);
            assert_eq!(read_entry.fields[0].value, "user@proton.me");

            // Toggle favorite
            let new_fav = exec_toggle_favorite(&state, "cmd-1".to_string()).await.unwrap();
            assert!(new_fav);

            // Search entry
            let search_res = exec_search_entries(&state, "proton".to_string(), None).await.unwrap();
            assert_eq!(search_res.len(), 1);

            // Delete entry
            let deleted = exec_delete_entry(&state, "cmd-1".to_string()).await.unwrap();
            assert!(deleted);

            let headers_after = exec_list_entry_headers(&state).await.unwrap();
            assert_eq!(headers_after.len(), 0);
        });
    }

    #[test]
    fn test_auto_lock_timeout_expires_and_blocks_access() {
        tauri::async_runtime::block_on(async {
            // Set an ultra-short 1-second auto-lock timeout
            let state = setup_test_app_state(1);
            exec_init_vault(&state, Zeroizing::new("TimeoutPassword".to_string())).await.unwrap();

            let status = exec_get_vault_status(&state).await.unwrap();
            assert!(status.is_unlocked);

            // Sleep 1.2 seconds to exceed inactivity timeout
            std::thread::sleep(std::time::Duration::from_millis(1200));

            // Calling get_vault_status should report locked
            let status_after = exec_get_vault_status(&state).await.unwrap();
            assert!(!status_after.is_unlocked);

            // Any attempt to list headers must return VaultLocked
            let res = exec_list_entry_headers(&state).await;
            assert!(matches!(res, Err(CommandError::VaultLocked)));
        });
    }

    #[test]
    fn test_touch_resets_auto_lock_timer() {
        tauri::async_runtime::block_on(async {
            // Set a 2-second timeout
            let state = setup_test_app_state(2);
            exec_init_vault(&state, Zeroizing::new("TouchPassword".to_string())).await.unwrap();

            // Sleep 1.2s then reset activity
            std::thread::sleep(std::time::Duration::from_millis(1200));
            exec_reset_activity(&state).await.unwrap();

            // Sleep another 1.2s (total 2.4s from start, but only 1.2s from touch)
            std::thread::sleep(std::time::Duration::from_millis(1200));

            // Should still be unlocked because timer was reset
            let status = exec_get_vault_status(&state).await.unwrap();
            assert!(status.is_unlocked);
        });
    }

    #[test]
    fn test_search_entry_headers_command() {
        tauri::async_runtime::block_on(async {
            let state = setup_test_app_state(300);
            exec_init_vault(&state, Zeroizing::new("SearchPass".to_string())).await.unwrap();

            let entry1 = VaultEntry {
                id: "hdr-s1".to_string(),
                title: "GitHub Personal".to_string(),
                category: "login".to_string(),
                is_favorite: false,
                fields: vec![],
                notes: None,
                created_at: 1000,
                updated_at: 1000,
            };
            exec_create_entry(&state, entry1).await.unwrap();

            // Fast search via command
            let results = exec_search_entry_headers(&state, "Git".to_string(), None).await.unwrap();
            assert_eq!(results.len(), 1);
            assert_eq!(results[0].title, "GitHub Personal");
        });
    }

    #[test]
    fn test_command_error_serialization() {
        let err = CommandError::VaultLocked;
        let json = serde_json::to_string(&err).unwrap();
        assert!(json.contains("\"code\":\"VAULT_LOCKED\""));
        assert!(json.contains("\"message\":\"Vault is currently locked\""));
    }
}

