// ============================================================================
// File: error.rs
// Description: Database error definitions covering SQLite operations,
//              cryptographic failures, serialization, and state violations.
// ============================================================================

use thiserror::Error;

#[derive(Error, Debug)]
pub enum DbError {
    #[error("SQLite database error: {0}")]
    SqliteError(#[from] rusqlite::Error),

    #[error("Cryptographic error: {0}")]
    CryptoError(#[from] crate::crypto::CryptoError),

    #[error("Serialization / Deserialization error: {0}")]
    SerializationError(#[from] serde_json::Error),

    #[error("Vault is not initialized. Please set up a Master Password first.")]
    VaultUninitialized,

    #[error("Vault has already been initialized.")]
    VaultAlreadyInitialized,

    #[error("Invalid master password or corrupted verifier token.")]
    InvalidMasterPassword,

    #[error("Vault entry with id '{0}' was not found.")]
    EntryNotFound(String),
}
