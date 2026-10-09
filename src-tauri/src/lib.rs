// ============================================================================
// File: lib.rs
// Description: Tauri application entry point, lifecycle builder, SQLite database
//              initialization, managed AppState registration, and IPC handlers.
// ============================================================================

pub mod commands;
pub mod crypto;
pub mod db;
pub mod models;

use std::fs;
use std::time::Duration;
use rusqlite::Connection;
use tauri::Manager;

// ----------------------------------------------------------------------------
// 1. run
// - Main runtime entry point configuring plugins, database storage, and IPC handlers.
//
// Args:
//   - None.
//
// Return:
//   - None (runs event loop).
// ----------------------------------------------------------------------------
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Step 1. Resolve application data directory path
            let app_handle = app.handle();
            let app_dir = app_handle
                .path()
                .app_data_dir()
                .map_err(|e| Box::new(e) as Box<dyn std::error::Error>)?;

            // Step 2. Ensure application storage directory exists
            fs::create_dir_all(&app_dir)?;

            // Step 3. Connect to local SQLite database with busy timeout & initialize schema
            let db_path = app_dir.join("vault.db");
            let conn = Connection::open(db_path)?;
            conn.busy_timeout(Duration::from_secs(5))?;
            db::init_schema(&conn)?;

            // Step 4. Register shared AppState for Tauri IPC command injection
            let app_state = commands::AppState::new(conn);
            app.manage(app_state);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::vault::get_vault_status,
            commands::vault::init_vault,
            commands::vault::unlock_vault,
            commands::vault::lock_vault,
            commands::vault::reset_activity,
            commands::entries::list_entry_headers,
            commands::entries::get_entry,
            commands::entries::create_entry,
            commands::entries::update_entry,
            commands::entries::delete_entry,
            commands::entries::toggle_favorite,
            commands::entries::search_entries,
            commands::entries::search_entry_headers,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
