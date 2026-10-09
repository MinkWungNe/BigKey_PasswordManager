// ============================================================================
// File: mod.rs
// Description: Local SQLite encrypted storage module for BigKey, providing
//              schema migration, dynamic card CRUD, verification, and tests.
// ============================================================================

pub mod error;
pub mod operations;
pub mod schema;

pub use error::DbError;
pub use operations::{
    create_entry, delete_entry, get_entry_by_id, get_vault_kdf_params, get_vault_salt,
    initialize_vault, is_vault_initialized, list_entries, list_entry_headers, search_entries,
    search_entry_headers, toggle_favorite, update_entry, verify_master_key,
};
pub use schema::{init_schema, SCHEMA_VERSION, VERIFIER_TOKEN_V1};

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;
    use crate::crypto::{kdf, KdfParams};
    use crate::models::{CustomField, FieldType, VaultEntry};

    // Helper: Creates an in-memory SQLite database initialized with schema.
    fn setup_test_db() -> Connection {
        let conn = Connection::open_in_memory().expect("Failed to create in-memory database");
        init_schema(&conn).expect("Failed to initialize database schema");
        conn
    }

    #[test]
    fn test_init_schema_creates_tables() {
        let conn = setup_test_db();
        assert!(!is_vault_initialized(&conn).unwrap());
    }

    #[test]
    fn test_vault_initialization_and_verification() {
        let conn = setup_test_db();
        let salt = kdf::generate_salt();
        let master_key = [0x42u8; 32];
        let default_params = KdfParams::default();

        // Step 1. Initialize vault with master key, salt, and KDF params
        initialize_vault(&conn, &master_key, &salt, &default_params).expect("Vault initialization failed");
        assert!(is_vault_initialized(&conn).unwrap());

        // Step 2. Verify master key matches
        let is_valid = verify_master_key(&conn, &master_key).expect("Verification check failed");
        assert!(is_valid, "Correct master key must be verified successfully");

        // Step 3. Retrieve salt and params, verify match
        let retrieved_salt = get_vault_salt(&conn).expect("Failed to get salt");
        assert_eq!(retrieved_salt, salt);

        let retrieved_params = get_vault_kdf_params(&conn).expect("Failed to get KDF params");
        assert_eq!(retrieved_params, default_params);
    }

    #[test]
    fn test_wrong_password_fails_verification() {
        let conn = setup_test_db();
        let salt = kdf::generate_salt();
        let master_key = [0x42u8; 32];
        let wrong_key = [0x99u8; 32];

        initialize_vault(&conn, &master_key, &salt, &KdfParams::default()).unwrap();

        let is_valid = verify_master_key(&conn, &wrong_key).expect("Verification check failed");
        assert!(!is_valid, "Wrong candidate key must be rejected by Poly1305 tag");
    }

    #[test]
    fn test_duplicate_initialization_fails() {
        let conn = setup_test_db();
        let salt = kdf::generate_salt();
        let master_key = [0x42u8; 32];

        initialize_vault(&conn, &master_key, &salt, &KdfParams::default()).unwrap();
        let result = initialize_vault(&conn, &master_key, &salt, &KdfParams::default());

        assert!(matches!(result, Err(DbError::VaultAlreadyInitialized)));
    }

    #[test]
    fn test_custom_kdf_params_backward_compatibility() {
        let conn = setup_test_db();
        let salt = kdf::generate_salt();

        // Custom legacy or custom params: 32 MiB, 2 iterations, 1 parallelism
        let custom_params = KdfParams {
            memory_kib: 32 * 1024,
            iterations: 2,
            parallelism: 1,
        };

        let password = zeroize::Zeroizing::new("CustomKdfMasterPassword#2026".to_string());
        let derived_key = kdf::derive_key_with_params(password, &salt, &custom_params).unwrap();

        // Initialize vault using custom params
        initialize_vault(&conn, &derived_key, &salt, &custom_params).unwrap();

        // Read params back from DB
        let stored_params = get_vault_kdf_params(&conn).unwrap();
        assert_eq!(stored_params, custom_params);

        // Verify key succeeds
        assert!(verify_master_key(&conn, &derived_key).unwrap());
    }

    #[test]
    fn test_create_and_read_login_entry_with_dynamic_fields() {
        let conn = setup_test_db();
        let master_key = [0x77u8; 32];

        let entry = VaultEntry {
            id: "entry-login-001".to_string(),
            title: "GitHub Account".to_string(),
            category: "login".to_string(),
            is_favorite: true,
            fields: vec![
                CustomField {
                    id: "f-1".to_string(),
                    label: "Username".to_string(),
                    field_type: FieldType::Text,
                    value: "minkwungne".to_string(),
                },
                CustomField {
                    id: "f-2".to_string(),
                    label: "Password".to_string(),
                    field_type: FieldType::Concealed,
                    value: "SuperSecretToken#2026".to_string(),
                },
                CustomField {
                    id: "f-3".to_string(),
                    label: "Website URL".to_string(),
                    field_type: FieldType::Url,
                    value: "https://github.com".to_string(),
                },
            ],
            notes: Some("Personal developer account".to_string()),
            created_at: 1775700000,
            updated_at: 1775700000,
        };

        create_entry(&conn, &master_key, &entry).expect("Create entry failed");

        let retrieved = get_entry_by_id(&conn, &master_key, "entry-login-001")
            .expect("Get entry failed")
            .expect("Entry should exist");

        assert_eq!(retrieved.id, "entry-login-001");
        assert_eq!(retrieved.title, "GitHub Account");
        assert_eq!(retrieved.category, "login");
        assert!(retrieved.is_favorite);
        assert_eq!(retrieved.fields.len(), 3);
        assert_eq!(retrieved.fields[0].label, "Username");
        assert_eq!(retrieved.fields[0].value, "minkwungne");
        assert_eq!(retrieved.fields[1].label, "Password");
        assert_eq!(retrieved.fields[1].value, "SuperSecretToken#2026");
        assert_eq!(retrieved.fields[1].field_type, FieldType::Concealed);
        assert_eq!(retrieved.notes, Some("Personal developer account".to_string()));
    }

    #[test]
    fn test_create_bank_card_entry_template() {
        let conn = setup_test_db();
        let master_key = [0x88u8; 32];

        let card_entry = VaultEntry {
            id: "card-vcb-001".to_string(),
            title: "Vietcombank Visa Platinum".to_string(),
            category: "card".to_string(),
            is_favorite: false,
            fields: vec![
                CustomField {
                    id: "c-1".to_string(),
                    label: "Cardholder Name".to_string(),
                    field_type: FieldType::Text,
                    value: "MINK WUNG NE".to_string(),
                },
                CustomField {
                    id: "c-2".to_string(),
                    label: "Card Number".to_string(),
                    field_type: FieldType::Concealed,
                    value: "4123 4567 8901 2345".to_string(),
                },
                CustomField {
                    id: "c-3".to_string(),
                    label: "Expiry Date".to_string(),
                    field_type: FieldType::Text,
                    value: "12/28".to_string(),
                },
                CustomField {
                    id: "c-4".to_string(),
                    label: "CVV".to_string(),
                    field_type: FieldType::Concealed,
                    value: "888".to_string(),
                },
                CustomField {
                    id: "c-5".to_string(),
                    label: "ATM PIN".to_string(),
                    field_type: FieldType::Concealed,
                    value: "654321".to_string(),
                },
            ],
            notes: Some("Emergency international card".to_string()),
            created_at: 1775700000,
            updated_at: 1775700000,
        };

        create_entry(&conn, &master_key, &card_entry).unwrap();

        let retrieved = get_entry_by_id(&conn, &master_key, "card-vcb-001").unwrap().unwrap();
        assert_eq!(retrieved.fields.len(), 5);
        assert_eq!(retrieved.fields[3].label, "CVV");
        assert_eq!(retrieved.fields[3].value, "888");
        assert_eq!(retrieved.fields[4].label, "ATM PIN");
        assert_eq!(retrieved.fields[4].value, "654321");
    }

    #[test]
    fn test_update_entry_fields() {
        let conn = setup_test_db();
        let master_key = [0x55u8; 32];

        let mut entry = VaultEntry {
            id: "item-up-01".to_string(),
            title: "Original Title".to_string(),
            category: "custom".to_string(),
            is_favorite: false,
            fields: vec![CustomField {
                id: "f-1".to_string(),
                label: "Custom Key".to_string(),
                field_type: FieldType::Text,
                value: "OldValue".to_string(),
            }],
            notes: None,
            created_at: 1775700000,
            updated_at: 1775700000,
        };

        create_entry(&conn, &master_key, &entry).unwrap();

        // Update fields and title
        entry.title = "Updated Title".to_string();
        entry.fields[0].value = "NewValue".to_string();
        entry.updated_at = 1775700500;
        update_entry(&conn, &master_key, &entry).expect("Update entry failed");

        let retrieved = get_entry_by_id(&conn, &master_key, "item-up-01").unwrap().unwrap();
        assert_eq!(retrieved.title, "Updated Title");
        assert_eq!(retrieved.fields[0].value, "NewValue");
        assert_eq!(retrieved.updated_at, 1775700500);
    }

    #[test]
    fn test_delete_entry() {
        let conn = setup_test_db();
        let master_key = [0x33u8; 32];

        let entry = VaultEntry {
            id: "item-del-01".to_string(),
            title: "Disposable Item".to_string(),
            category: "note".to_string(),
            is_favorite: false,
            fields: vec![],
            notes: Some("Secret content".to_string()),
            created_at: 1775700000,
            updated_at: 1775700000,
        };

        create_entry(&conn, &master_key, &entry).unwrap();
        let deleted = delete_entry(&conn, "item-del-01").unwrap();
        assert!(deleted);

        let retrieved = get_entry_by_id(&conn, &master_key, "item-del-01").unwrap();
        assert!(retrieved.is_none());
    }

    #[test]
    fn test_toggle_favorite() {
        let conn = setup_test_db();
        let master_key = [0x22u8; 32];

        let entry = VaultEntry {
            id: "fav-01".to_string(),
            title: "Pin Entry".to_string(),
            category: "login".to_string(),
            is_favorite: false,
            fields: vec![],
            notes: None,
            created_at: 1775700000,
            updated_at: 1775700000,
        };

        create_entry(&conn, &master_key, &entry).unwrap();

        let is_fav = toggle_favorite(&conn, "fav-01").unwrap();
        assert!(is_fav);

        let is_fav2 = toggle_favorite(&conn, "fav-01").unwrap();
        assert!(!is_fav2);
    }

    #[test]
    fn test_search_entries_by_title_category_and_field_values() {
        let conn = setup_test_db();
        let master_key = [0x11u8; 32];

        let item1 = VaultEntry {
            id: "s-1".to_string(),
            title: "Amazon Prime".to_string(),
            category: "login".to_string(),
            is_favorite: false,
            fields: vec![CustomField {
                id: "f-1".to_string(),
                label: "Username".to_string(),
                field_type: FieldType::Text,
                value: "buyer@example.com".to_string(),
            }],
            notes: Some("Shopping service".to_string()),
            created_at: 1775700000,
            updated_at: 1775700000,
        };

        let item2 = VaultEntry {
            id: "s-2".to_string(),
            title: "AWS Cloud Console".to_string(),
            category: "cloud".to_string(),
            is_favorite: true,
            fields: vec![CustomField {
                id: "f-2".to_string(),
                label: "IAM User".to_string(),
                field_type: FieldType::Text,
                value: "admin-root".to_string(),
            }],
            notes: Some("DevOps infrastructure".to_string()),
            created_at: 1775700000,
            updated_at: 1775700100,
        };

        create_entry(&conn, &master_key, &item1).unwrap();
        create_entry(&conn, &master_key, &item2).unwrap();

        // 1. Search by title keyword "Amazon"
        let res1 = search_entries(&conn, &master_key, "Amazon", None).unwrap();
        assert_eq!(res1.len(), 1);
        assert_eq!(res1[0].id, "s-1");

        // 2. Search by field value "admin-root"
        let res2 = search_entries(&conn, &master_key, "admin-root", None).unwrap();
        assert_eq!(res2.len(), 1);
        assert_eq!(res2[0].id, "s-2");

        // 3. Search with category filter
        let res3 = search_entries(&conn, &master_key, "", Some("cloud")).unwrap();
        assert_eq!(res3.len(), 1);
        assert_eq!(res3[0].id, "s-2");

        // 4. Search matching both but filtered by category "login"
        let res4 = search_entries(&conn, &master_key, "", Some("login")).unwrap();
        assert_eq!(res4.len(), 1);
        assert_eq!(res4[0].id, "s-1");
    }

    #[test]
    fn test_tampered_encrypted_blob_in_database_fails_authentication() {
        let conn = setup_test_db();
        let master_key = [0x99u8; 32];

        let entry = VaultEntry {
            id: "tamper-01".to_string(),
            title: "Target Card".to_string(),
            category: "login".to_string(),
            is_favorite: false,
            fields: vec![],
            notes: Some("Sensitive data".to_string()),
            created_at: 1775700000,
            updated_at: 1775700000,
        };

        create_entry(&conn, &master_key, &entry).unwrap();

        // Simulate attacker directly corrupting a byte of the encrypted_data column in SQLite
        conn.execute(
            "UPDATE entries
             SET encrypted_data = X'01' || substr(encrypted_data, 2, 24) || X'FF' || substr(encrypted_data, 27)
             WHERE id = 'tamper-01'",
            [],
        ).unwrap();

        // Attempting to read the corrupted entry must fail at cipher authentication
        let result = get_entry_by_id(&conn, &master_key, "tamper-01");
        assert!(result.is_err(), "Tampered encrypted_data must be detected and rejected");
    }

    #[test]
    fn test_list_entry_headers_performance_friendly() {
        let conn = setup_test_db();
        let master_key = [0x55u8; 32];

        let entry1 = VaultEntry {
            id: "hdr-1".to_string(),
            title: "Header Item 1".to_string(),
            category: "login".to_string(),
            is_favorite: false,
            fields: vec![CustomField {
                id: "f-1".to_string(),
                label: "Username".to_string(),
                field_type: FieldType::Text,
                value: "user1".to_string(),
            }],
            notes: Some("Notes 1".to_string()),
            created_at: 1000,
            updated_at: 1000,
        };

        let entry2 = VaultEntry {
            id: "hdr-2".to_string(),
            title: "Header Item 2 (Favorite)".to_string(),
            category: "card".to_string(),
            is_favorite: true,
            fields: vec![],
            notes: None,
            created_at: 1000,
            updated_at: 2000,
        };

        create_entry(&conn, &master_key, &entry1).unwrap();
        create_entry(&conn, &master_key, &entry2).unwrap();

        // Query headers without passing master key (zero decryption overhead)
        let headers = list_entry_headers(&conn).expect("Failed to list entry headers");
        assert_eq!(headers.len(), 2);

        // Favorite entry must come first
        assert_eq!(headers[0].id, "hdr-2");
        assert_eq!(headers[0].title, "Header Item 2 (Favorite)");
        assert_eq!(headers[0].category, "card");
        assert!(headers[0].is_favorite);
        assert_eq!(headers[0].updated_at, 2000);

        // Second entry
        assert_eq!(headers[1].id, "hdr-1");
        assert_eq!(headers[1].title, "Header Item 1");
        assert!(!headers[1].is_favorite);
        assert_eq!(headers[1].updated_at, 1000);
    }

    #[test]
    fn test_search_entry_headers_fast_sql() {
        let conn = setup_test_db();
        let master_key = [0x77u8; 32];

        let entry1 = VaultEntry {
            id: "fast-1".to_string(),
            title: "GitHub Personal".to_string(),
            category: "login".to_string(),
            is_favorite: true,
            fields: vec![],
            notes: None,
            created_at: 1000,
            updated_at: 2000,
        };

        let entry2 = VaultEntry {
            id: "fast-2".to_string(),
            title: "GitLab Work".to_string(),
            category: "login".to_string(),
            is_favorite: false,
            fields: vec![],
            notes: None,
            created_at: 1000,
            updated_at: 1500,
        };

        let entry3 = VaultEntry {
            id: "fast-3".to_string(),
            title: "Bank Card Visa".to_string(),
            category: "card".to_string(),
            is_favorite: false,
            fields: vec![],
            notes: None,
            created_at: 1000,
            updated_at: 1000,
        };

        create_entry(&conn, &master_key, &entry1).unwrap();
        create_entry(&conn, &master_key, &entry2).unwrap();
        create_entry(&conn, &master_key, &entry3).unwrap();

        // 1. Search for "Git" across all categories -> matches fast-1 and fast-2
        let res1 = search_entry_headers(&conn, "Git", None).unwrap();
        assert_eq!(res1.len(), 2);
        assert_eq!(res1[0].id, "fast-1"); // Favorite first
        assert_eq!(res1[1].id, "fast-2");

        // 2. Search for "Git" filtered by category "card" -> 0 matches
        let res2 = search_entry_headers(&conn, "Git", Some("card")).unwrap();
        assert_eq!(res2.len(), 0);

        // 3. Search empty query filtered by category "card" -> matches fast-3
        let res3 = search_entry_headers(&conn, "", Some("card")).unwrap();
        assert_eq!(res3.len(), 1);
        assert_eq!(res3[0].id, "fast-3");
    }
}

