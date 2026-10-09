// ============================================================================
// File: entry.rs
// Description: Core vault data structures with automatic zeroization on drop
//              and sanitized debug formatting for in-memory safety.
// ============================================================================

use serde::{Deserialize, Serialize};
use zeroize::{Zeroize, ZeroizeOnDrop};

#[derive(Clone, Serialize, Deserialize, Zeroize, ZeroizeOnDrop)]
pub struct VaultEntry {
    #[zeroize(skip)]
    pub id: String,

    pub title: String,
    pub username: String,

    // Sensitive credential fields zeroized from RAM upon drop
    pub password: String,
    pub url: Option<String>,
    pub notes: Option<String>,

    #[zeroize(skip)]
    pub category: String, // "login", "note", "card"

    #[zeroize(skip)]
    pub created_at: i64, // UTC Unix timestamp in seconds
    #[zeroize(skip)]
    pub updated_at: i64, // UTC Unix timestamp in seconds
}

impl std::fmt::Debug for VaultEntry {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("VaultEntry")
            .field("id", &self.id)
            .field("title", &self.title)
            .field("username", &self.username)
            .field("password", &"[REDACTED]")
            .field("url", &self.url)
            .field("notes", &self.notes.as_ref().map(|_| "[REDACTED]"))
            .field("category", &self.category)
            .field("created_at", &self.created_at)
            .field("updated_at", &self.updated_at)
            .finish()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultStatus {
    pub is_initialized: bool,
    pub is_unlocked: bool,
}
