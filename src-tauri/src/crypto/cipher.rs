// ============================================================================
// File: cipher.rs
// Description: Symmetric authenticated encryption engine using XChaCha20-Poly1305
//              with envelope versioning and zeroized plaintext buffers.
// ============================================================================

use chacha20poly1305::{
    aead::{Aead, KeyInit},
    Key, XChaCha20Poly1305, XNonce,
};
use zeroize::Zeroizing;

use super::CryptoError;

pub const CIPHER_VERSION_V1: u8 = 0x01;
pub const NONCE_LENGTH: usize = 24; // 192-bit nonce
pub const TAG_LENGTH: usize = 16;   // 128-bit Poly1305 authentication tag
pub const MIN_PAYLOAD_LENGTH: usize = 1 + NONCE_LENGTH + TAG_LENGTH; // 41 bytes

// ----------------------------------------------------------------------------
// 1. encrypt
// - Encrypts plaintext using XChaCha20-Poly1305 into a versioned envelope payload.
//
// Args:
//   - key: A 32-byte symmetric master key reference.
//   - plaintext: Plaintext byte slice to encrypt.
//
// Return:
//   - Result<Vec<u8>, CryptoError>: Packed envelope payload [Version][Nonce][Ciphertext+Tag].
// ----------------------------------------------------------------------------
pub fn encrypt(key: &[u8; 32], plaintext: &[u8]) -> Result<Vec<u8>, CryptoError> {
    // Step 1. Generate 24-byte random CSPRNG nonce
    let nonce_bytes: [u8; NONCE_LENGTH] = rand::random();
    let nonce = XNonce::from_slice(&nonce_bytes);

    // Step 2. Initialize cipher instance and encrypt plaintext
    let cipher = XChaCha20Poly1305::new(Key::from_slice(key));
    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|_| CryptoError::EncryptionFailed)?;

    // Step 3. Assemble versioned envelope payload: [0x01][Nonce][Ciphertext + Tag]
    let mut payload = Vec::with_capacity(1 + NONCE_LENGTH + ciphertext.len());
    payload.push(CIPHER_VERSION_V1);
    payload.extend_from_slice(&nonce_bytes);
    payload.extend_from_slice(&ciphertext);

    Ok(payload)
}

// ----------------------------------------------------------------------------
// 2. decrypt
// - Decrypts and authenticates a versioned envelope payload into zeroized plaintext.
//
// Args:
//   - key: A 32-byte symmetric master key reference.
//   - payload: Packed envelope payload byte slice.
//
// Return:
//   - Result<Zeroizing<Vec<u8>>, CryptoError>: Authenticated plaintext in zeroized memory.
// ----------------------------------------------------------------------------
pub fn decrypt(key: &[u8; 32], payload: &[u8]) -> Result<Zeroizing<Vec<u8>>, CryptoError> {
    // Step 1. Validate payload length against minimum envelope size (41 bytes)
    if payload.len() < MIN_PAYLOAD_LENGTH {
        return Err(CryptoError::PayloadTooShort);
    }

    // Step 2. Verify envelope version header
    let version = payload[0];
    if version != CIPHER_VERSION_V1 {
        return Err(CryptoError::UnsupportedVersion(version));
    }

    // Step 3. Extract nonce and ciphertext slices
    let nonce_bytes = &payload[1..1 + NONCE_LENGTH];
    let nonce = XNonce::from_slice(nonce_bytes);
    let ciphertext = &payload[1 + NONCE_LENGTH..];

    // Step 4. Decrypt and authenticate payload using Poly1305 MAC tag
    let cipher = XChaCha20Poly1305::new(Key::from_slice(key));
    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|_| CryptoError::DecryptionFailed)?;

    Ok(Zeroizing::new(plaintext))
}
