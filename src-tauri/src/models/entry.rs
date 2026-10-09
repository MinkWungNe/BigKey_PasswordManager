// ============================================================================
// File: entry.rs
// Description: Dynamic vault item structures supporting custom ordered fields,
//              templates, memory zeroization on drop, and sanitized debug logging.
// ============================================================================

use serde::{Deserialize, Serialize};
use zeroize::{Zeroize, ZeroizeOnDrop};

/// Supported field types for customizable vault cards.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Zeroize)]
#[serde(rename_all = "lowercase")]
pub enum FieldType {
    Text,
    Concealed,
    Note,
    Url,
}

/// An individual field within a vault item with custom label, order, and type.
#[derive(Clone, Serialize, Deserialize, Zeroize, ZeroizeOnDrop)]
pub struct CustomField {
    #[zeroize(skip)]
    pub id: String,

    #[zeroize(skip)]
    pub label: String,

    #[zeroize(skip)]
    pub field_type: FieldType,

    // Sensitive field value zeroized from RAM upon drop
    pub value: String,
}

impl std::fmt::Debug for CustomField {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let display_val = if self.field_type == FieldType::Concealed {
            "[REDACTED]"
        } else {
            &self.value
        };
        f.debug_struct("CustomField")
            .field("id", &self.id)
            .field("label", &self.label)
            .field("field_type", &self.field_type)
            .field("value", &display_val)
            .finish()
    }
}

/// Encrypted payload containing all dynamic fields and notes of a card.
#[derive(Clone, Serialize, Deserialize, Zeroize, ZeroizeOnDrop, Default)]
pub struct VaultItemPayload {
    pub fields: Vec<CustomField>,
    pub notes: Option<String>,
}

/// In-memory representation of a decrypted vault entry.
#[derive(Clone, Serialize, Deserialize, Zeroize, ZeroizeOnDrop)]
pub struct VaultEntry {
    #[zeroize(skip)]
    pub id: String,

    pub title: String,

    #[zeroize(skip)]
    pub category: String, // "login", "card", "note", "custom"

    #[zeroize(skip)]
    pub is_favorite: bool,

    // Dynamic list of custom fields in user-defined order
    pub fields: Vec<CustomField>,

    // Optional overall notes for the card
    pub notes: Option<String>,

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
            .field("category", &self.category)
            .field("is_favorite", &self.is_favorite)
            .field("fields_count", &self.fields.len())
            .field("has_notes", &self.notes.is_some())
            .field("created_at", &self.created_at)
            .field("updated_at", &self.updated_at)
            .finish()
    }
}

/// Lightweight summary header for dashboard list view (zero decryption overhead).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct VaultEntryHeader {
    pub id: String,
    pub title: String,
    pub category: String,
    pub is_favorite: bool,
    pub updated_at: i64,
}

/// Application vault lifecycle and unlock state.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultStatus {
    pub is_initialized: bool,
    pub is_unlocked: bool,
}
