// ============================================================================
// File: kdf.rs
// Description: Argon2id Key Derivation Function (RFC 9106) implementation
//              for deriving 256-bit symmetric keys from master passwords.
// ============================================================================

use argon2::{Algorithm, Argon2, Params, Version};
use zeroize::Zeroizing;

use super::CryptoError;

pub const ARGON2_MEMORY_KIB: u32 = 64 * 1024; // 64 MiB memory cost (RFC 9106 recommended)
pub const ARGON2_ITERATIONS: u32 = 3;         // 3 iterations (time cost)
pub const ARGON2_PARALLELISM: u32 = 2;        // 2 degrees of parallelism (balanced for mobile multi-core responsiveness)
pub const KEY_LENGTH: usize = 32;             // 256-bit symmetric key length in bytes

// ----------------------------------------------------------------------------
// 1. generate_salt
// - Generates a secure 16-byte random cryptographic salt using OS CSPRNG.
//
// Args:
//   - None
//
// Return:
//   - [u8; 16]: A 16-byte cryptographically secure random salt array.
// ----------------------------------------------------------------------------
pub fn generate_salt() -> [u8; 16] {
    rand::random()
}

// ----------------------------------------------------------------------------
// 2. derive_key
// - Derives a 256-bit symmetric key from master password and salt via Argon2id.
//
// Args:
//   - password: Sensitive plaintext password wrapped in Zeroizing<String> (consumed).
//   - salt: Cryptographic salt byte slice (expected 16 bytes).
//
// Return:
//   - Result<Zeroizing<[u8; KEY_LENGTH]>, CryptoError>: 32-byte derived key or error.
// ----------------------------------------------------------------------------
pub fn derive_key(password: Zeroizing<String>, salt: &[u8]) -> Result<Zeroizing<[u8; KEY_LENGTH]>, CryptoError> {
    // Step 1. Configure Argon2id hashing parameters
    let params = Params::new(
        ARGON2_MEMORY_KIB,
        ARGON2_ITERATIONS,
        ARGON2_PARALLELISM,
        Some(KEY_LENGTH),
    )
    .map_err(|e| CryptoError::KdfError(e.to_string()))?;

    // Step 2. Initialize Argon2id context
    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);

    // Step 3. Compute derived key into zeroized memory buffer
    let mut key = Zeroizing::new([0u8; KEY_LENGTH]);
    argon2
        .hash_password_into(password.as_bytes(), salt, &mut *key)
        .map_err(|e| CryptoError::KdfError(e.to_string()))?;

    // Password is automatically dropped and zeroized from RAM upon function return.
    Ok(key)
}
