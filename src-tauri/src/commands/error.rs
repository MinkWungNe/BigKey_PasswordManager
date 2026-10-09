// ============================================================================
// File: error.rs
// Description: Centralized Tauri IPC command error enumeration with structured
//              JSON serialization for typed frontend error handling.
// ============================================================================

use serde::ser::SerializeStruct;
use serde::Serialize;
use thiserror::Error;

use crate::crypto::CryptoError;
use crate::db::DbError;

/// High-level IPC command error variants returned to the frontend.
#[derive(Debug, Error)]
pub enum CommandError {
    #[error("Vault is not initialized yet")]
    VaultUninitialized,

    #[error("Vault has already been initialized")]
    VaultAlreadyInitialized,

    #[error("Vault is currently locked")]
    VaultLocked,

    #[error("Invalid master password")]
    InvalidMasterPassword,

    #[error("Entry not found: {0}")]
    EntryNotFound(String),

    #[error("Database operation failed: {0}")]
    DatabaseError(String),

    #[error("Cryptographic operation failed: {0}")]
    CryptoError(String),

    #[error("Internal runtime task failed: {0}")]
    InternalError(String),
}

impl CommandError {
    /// Returns the uppercase machine-readable error code string.
    pub fn code(&self) -> &'static str {
        match self {
            Self::VaultUninitialized => "VAULT_UNINITIALIZED",
            Self::VaultAlreadyInitialized => "VAULT_ALREADY_INITIALIZED",
            Self::VaultLocked => "VAULT_LOCKED",
            Self::InvalidMasterPassword => "INVALID_MASTER_PASSWORD",
            Self::EntryNotFound(_) => "ENTRY_NOT_FOUND",
            Self::DatabaseError(_) => "DATABASE_ERROR",
            Self::CryptoError(_) => "CRYPTO_ERROR",
            Self::InternalError(_) => "INTERNAL_ERROR",
        }
    }
}

impl Serialize for CommandError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let mut state = serializer.serialize_struct("CommandError", 2)?;
        state.serialize_field("code", self.code())?;
        state.serialize_field("message", &self.to_string())?;
        state.end()
    }
}

impl From<DbError> for CommandError {
    fn from(err: DbError) -> Self {
        match err {
            DbError::VaultUninitialized => Self::VaultUninitialized,
            DbError::VaultAlreadyInitialized => Self::VaultAlreadyInitialized,
            DbError::InvalidMasterPassword => Self::InvalidMasterPassword,
            DbError::EntryNotFound(id) => Self::EntryNotFound(id),
            DbError::CryptoError(e) => Self::CryptoError(e.to_string()),
            other => Self::DatabaseError(other.to_string()),
        }
    }
}

impl From<CryptoError> for CommandError {
    fn from(err: CryptoError) -> Self {
        Self::CryptoError(err.to_string())
    }
}
