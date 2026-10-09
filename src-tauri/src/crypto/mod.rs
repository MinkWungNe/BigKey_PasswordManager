// ============================================================================
// File: mod.rs
// Description: Core cryptographic definitions, errors, and comprehensive
//              unit test suite for BigKey password manager.
// ============================================================================

pub mod cipher;
pub mod kdf;

use thiserror::Error;

#[derive(Error, Debug, PartialEq, Eq)]
pub enum CryptoError {
    #[error("Argon2id key derivation failed: {0}")]
    KdfError(String),

    #[error("Encryption failed")]
    EncryptionFailed,

    #[error("Payload is too short to contain valid header, nonce, and tag")]
    PayloadTooShort,

    #[error("Unsupported cipher version: {0:#04x}")]
    UnsupportedVersion(u8),

    #[error("Decryption failed: invalid key or corrupted/tampered payload")]
    DecryptionFailed,
}

pub use cipher::{decrypt, encrypt, CIPHER_VERSION_V1, MIN_PAYLOAD_LENGTH, NONCE_LENGTH};
pub use kdf::{derive_key, generate_salt, ARGON2_ITERATIONS, ARGON2_MEMORY_KIB, ARGON2_PARALLELISM, KEY_LENGTH};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_salt_validity() {
        let salt1 = generate_salt();
        let salt2 = generate_salt();
        assert_eq!(salt1.len(), 16);
        assert_eq!(salt2.len(), 16);
        assert_ne!(salt1, salt2, "Two random salts must not be identical");
    }

    #[test]
    fn test_argon2id_deterministic() {
        let salt = [42u8; 16];

        let p1 = zeroize::Zeroizing::new("SuperSecretMasterPassword!2026".to_string());
        let p2 = zeroize::Zeroizing::new("SuperSecretMasterPassword!2026".to_string());

        let key1 = derive_key(p1, &salt).expect("Key derivation 1 failed");
        let key2 = derive_key(p2, &salt).expect("Key derivation 2 failed");

        assert_eq!(*key1, *key2, "Identical password and salt must produce the exact same key");
        assert_eq!(key1.len(), 32, "Derived key length must be 32 bytes (256-bit)");
    }

    #[test]
    fn test_argon2id_different_salts_produce_different_keys() {
        let salt1 = [1u8; 16];
        let salt2 = [2u8; 16];

        let p1 = zeroize::Zeroizing::new("SuperSecretMasterPassword!2026".to_string());
        let p2 = zeroize::Zeroizing::new("SuperSecretMasterPassword!2026".to_string());

        let key1 = derive_key(p1, &salt1).expect("Key derivation 1 failed");
        let key2 = derive_key(p2, &salt2).expect("Key derivation 2 failed");

        assert_ne!(*key1, *key2, "Different salts must produce distinct symmetric keys");
    }

    #[test]
    fn test_encrypt_decrypt_roundtrip() {
        let key = [0x5au8; 32];
        let secret_message = b"My Banking PIN: 849201 & Secret Note: Antigravity";

        let encrypted = encrypt(&key, secret_message).expect("Encryption failed");
        assert!(encrypted.len() >= MIN_PAYLOAD_LENGTH + secret_message.len());

        let decrypted = decrypt(&key, &encrypted).expect("Decryption failed");
        assert_eq!(&*decrypted, secret_message, "Decrypted data must match the original plaintext exactly");
    }

    #[test]
    fn test_envelope_structure_and_random_nonces() {
        let key = [0x7bu8; 32];
        let message = b"Confidential Password";

        let enc1 = encrypt(&key, message).expect("Encryption 1 failed");
        let enc2 = encrypt(&key, message).expect("Encryption 2 failed");

        assert_eq!(enc1[0], CIPHER_VERSION_V1, "First byte must match CIPHER_VERSION_V1 (0x01)");
        assert_eq!(enc2[0], CIPHER_VERSION_V1, "First byte must match CIPHER_VERSION_V1 (0x01)");

        assert_ne!(enc1, enc2, "Identical plaintext must yield different ciphertexts due to random nonces");

        assert_eq!(&*decrypt(&key, &enc1).unwrap(), message);
        assert_eq!(&*decrypt(&key, &enc2).unwrap(), message);
    }

    #[test]
    fn test_tampered_ciphertext_fails() {
        let key = [0x33u8; 32];
        let message = b"Critical security payload";

        let mut encrypted = encrypt(&key, message).expect("Encryption failed");

        // Simulate attacker flipping a single bit in the ciphertext
        let last_idx = encrypted.len() - 1;
        encrypted[last_idx] ^= 0xff;

        let result = decrypt(&key, &encrypted);
        assert_eq!(
            result.err(),
            Some(CryptoError::DecryptionFailed),
            "Poly1305 MAC tag must detect tampering and reject decryption"
        );
    }

    #[test]
    fn test_unsupported_version_fails() {
        let key = [0x12u8; 32];
        let mut encrypted = encrypt(&key, b"Test version byte").unwrap();

        // Tamper version byte to 0x99
        encrypted[0] = 0x99;

        let result = decrypt(&key, &encrypted);
        assert_eq!(
            result.err(),
            Some(CryptoError::UnsupportedVersion(0x99)),
            "Must return UnsupportedVersion error when encountering unknown version byte"
        );
    }

    #[test]
    fn test_payload_too_short_fails() {
        let key = [0x12u8; 32];
        let short_payload = vec![0x01, 0x02, 0x03]; // Only 3 bytes, under minimum 41 bytes

        let result = decrypt(&key, &short_payload);
        assert_eq!(
            result.err(),
            Some(CryptoError::PayloadTooShort),
            "Must return PayloadTooShort error when payload length is under 41 bytes"
        );
    }

    #[test]
    fn test_wrong_key_fails_decrypt() {
        let key1 = [0x11u8; 32];
        let key2 = [0x22u8; 32];

        let encrypted = encrypt(&key1, b"Secret").unwrap();
        let result = decrypt(&key2, &encrypted);

        assert_eq!(
            result.err(),
            Some(CryptoError::DecryptionFailed),
            "Decryption with wrong key must fail with DecryptionFailed error"
        );
    }
}
