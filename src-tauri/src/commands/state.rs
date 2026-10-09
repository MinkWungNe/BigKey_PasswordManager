// ============================================================================
// File: state.rs
// Description: Application state, memory-zeroizing session key storage, and
//              inactivity auto-lock timer management for BigKey IPC commands.
// ============================================================================

use std::sync::{Mutex, RwLock};
use std::time::{Duration, Instant};
use rusqlite::Connection;
use zeroize::Zeroizing;

use super::error::CommandError;

/// Default auto-lock inactivity duration in seconds (5 minutes).
pub const DEFAULT_AUTO_LOCK_TIMEOUT_SECS: u64 = 300;

/// In-memory vault session holding sensitive key and tracking user activity.
pub struct VaultSession {
    master_key: Option<Zeroizing<[u8; 32]>>,
    last_activity: Instant,
    auto_lock_duration: Duration,
}

impl VaultSession {
    /// Creates a new locked session with a specified auto-lock timeout.
    pub fn new(timeout_secs: u64) -> Self {
        Self {
            master_key: None,
            last_activity: Instant::now(),
            auto_lock_duration: Duration::from_secs(timeout_secs),
        }
    }

    /// Checks whether the session is currently active and not expired.
    pub fn is_unlocked(&self) -> bool {
        if self.master_key.is_none() {
            return false;
        }
        self.last_activity.elapsed() < self.auto_lock_duration
    }

    /// Immediately zeroizes and removes the master key from memory.
    pub fn lock(&mut self) {
        self.master_key.take();
        self.last_activity = Instant::now();
    }

    /// Stores the derived master key in RAM and refreshes activity timer.
    pub fn unlock(&mut self, key: Zeroizing<[u8; 32]>) {
        self.master_key = Some(key);
        self.last_activity = Instant::now();
    }

    /// Refreshes the last activity timestamp to prevent auto-lock timeout.
    pub fn touch(&mut self) {
        self.last_activity = Instant::now();
    }

    /// Retrieves an ephemeral Zeroizing clone of the key if session is active.
    pub fn get_key_if_active(&mut self) -> Result<Zeroizing<[u8; 32]>, CommandError> {
        if self.master_key.is_none() {
            return Err(CommandError::VaultLocked);
        }

        if self.last_activity.elapsed() >= self.auto_lock_duration {
            self.lock();
            return Err(CommandError::VaultLocked);
        }

        self.touch();
        Ok(self.master_key.as_ref().unwrap().clone())
    }
}

/// Shared application state managed by Tauri across IPC threads.
pub struct AppState {
    pub db: Mutex<Connection>,
    pub session: RwLock<VaultSession>,
}

impl AppState {
    // ----------------------------------------------------------------------------
    // 1. new
    // - Creates a new AppState using the default 5-minute auto-lock timeout.
    //
    // Args:
    //   - conn: An open rusqlite Connection instance.
    //
    // Return:
    //   - Self: Initialized AppState holding database mutex and locked session.
    // ----------------------------------------------------------------------------
    pub fn new(conn: Connection) -> Self {
        Self::with_timeout(conn, DEFAULT_AUTO_LOCK_TIMEOUT_SECS)
    }

    // ----------------------------------------------------------------------------
    // 2. with_timeout
    // - Creates a new AppState with a custom auto-lock timeout in seconds.
    //
    // Args:
    //   - conn: An open rusqlite Connection instance.
    //   - timeout_secs: Inactivity threshold before auto-locking in seconds.
    //
    // Return:
    //   - Self: Initialized AppState instance.
    // ----------------------------------------------------------------------------
    pub fn with_timeout(conn: Connection, timeout_secs: u64) -> Self {
        Self {
            db: Mutex::new(conn),
            session: RwLock::new(VaultSession::new(timeout_secs)),
        }
    }

    // ----------------------------------------------------------------------------
    // 3. check_unlocked_and_cleanup
    // - Checks unlock status and automatically purges expired key from memory.
    //
    // Args:
    //   - None (takes &self).
    //
    // Return:
    //   - bool: True if currently unlocked and valid, false if locked or expired.
    // ----------------------------------------------------------------------------
    pub fn check_unlocked_and_cleanup(&self) -> bool {
        let mut session = self.session.write().unwrap();
        if session.master_key.is_none() {
            return false;
        }
        if session.last_activity.elapsed() >= session.auto_lock_duration {
            session.lock();
            false
        } else {
            true
        }
    }

    // ----------------------------------------------------------------------------
    // 4. get_active_session_key
    // - Retrieves an ephemeral zeroizing master key, triggering auto-lock if expired.
    //
    // Args:
    //   - None (takes &self).
    //
    // Return:
    //   - Result<Zeroizing<[u8; 32]>, CommandError>: Active master key or VaultLocked.
    // ----------------------------------------------------------------------------
    pub fn get_active_session_key(&self) -> Result<Zeroizing<[u8; 32]>, CommandError> {
        let mut session = self.session.write().unwrap();
        session.get_key_if_active()
    }
}
