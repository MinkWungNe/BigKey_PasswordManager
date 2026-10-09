# 🛡️ BigKey
### One Key for All — Zero-Knowledge & Local-First Password Manager

[![Tauri v2](https://img.shields.io/badge/Tauri-v2.x-24C8DB?style=for-the-badge&logo=tauri&logoColor=white)](https://v2.tauri.app/)
[![Rust](https://img.shields.io/badge/Rust-2021_Edition-DEA584?style=for-the-badge&logo=rust&logoColor=black)](https://www.rust-lang.org/)
[![React 19](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg?style=for-the-badge)](LICENSE)

*BigKey is an ultra-fast, offline-first, and uncompromisingly secure password manager engineered with Rust and Tauri v2.*

</div>

---

## 🌟 Key Highlights

- **🔒 Zero-Knowledge Architecture**: Your Master Password and encryption keys never leave your device. All cryptographic operations happen exclusively in local client memory.
- **⚡ Military-Grade Cryptography**:
  - **Argon2id (RFC 9106)**: Industry-standard memory-hard key derivation function to thwart GPU/ASIC brute-force cracking.
  - **XChaCha20-Poly1305 (AEAD)**: Modern authenticated symmetric cipher with a 192-bit nonce, eliminating nonce collision risks in decentralized setups.
- **🧹 Memory Hygiene (`zeroize`)**: Sensitive strings and intermediate keys are forcefully overwritten with zero-bytes (`ZeroizeOnDrop`) as soon as they exit scope to prevent RAM dumping.
- **📱 True Cross-Platform**: Native desktop performance on **Windows 10/11** and seamless mobile support on **Android 8.0+ (API 26+)**.
- **📦 Ultra Lightweight**: Native OS WebViews keep binary sizes and memory footprints drastically smaller than traditional Electron apps.

---

## 📐 High-Level Architecture

```
+-------------------------------------------------------------+
|                     BigKey Frontend                         |
|          (React 19 + TypeScript + Tailwind CSS v4)          |
+-------------------------------------------------------------+
                              │
                    Tauri IPC Commands
                              │
+-------------------------------------------------------------+
|                     Rust Security Core                      |
|  ┌─────────────────────┐       ┌─────────────────────────┐  |
|  │      Argon2id       │       │   XChaCha20-Poly1305    │  |
|  │ (Master Key Derive) │       │ (AEAD Vault Encryption) │  |
|  └─────────────────────┘       └─────────────────────────┘  |
|  ┌─────────────────────┐       ┌─────────────────────────┐  |
|  │    Zeroize Guard    │       │     SQLite Encrypted    │  |
|  │   (RAM Sanitizer)   │       │   (Local Query Storage) │  |
|  └─────────────────────┘       └─────────────────────────┘  |
+-------------------------------------------------------------+
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Tauri v2 | Secure cross-platform runtime bridge |
| **Core Logic** | Rust | Memory safety, deterministic lifecycle, cryptographic primitives |
| **Key Derivation** | Argon2id (RFC 9106) | GPU-resistant password hashing |
| **Cipher** | XChaCha20-Poly1305 | Authenticated encryption with associated data |
| **RAM Security** | `zeroize` | Automated zero-wipe on memory drop |
| **Database** | SQLite / SQLCipher | High-performance local indexed encrypted database |
| **Frontend UI** | React 19 + TypeScript | Component-based modern UI |
| **Styling** | Tailwind CSS v4 + Lucide | Minimalist dark-themed design system |

---

## 🚀 Getting Started

### Prerequisites

Make sure the following tools are installed on your workstation:
1. **Node.js** (v18 or newer) & **npm**
2. **Rust & Cargo** (v1.75 or newer)
3. **C++ Build Tools** (Visual Studio C++ Build Tools on Windows)
4. *(Optional for Android build)* **Android SDK & NDK** (API 26+)

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/MinkWungNe/BigKey.git
cd BigKey

# Install frontend dependencies
npm install

# Run the desktop app in development mode
npm run tauri dev
```

### Production Build

```bash
# Build desktop executable (.exe / .msi)
npm run tauri build
```

---

## 🔐 Security Principles & Disclosure

1. **Kerckhoffs's Principle**: Security relies purely on the secrecy of the user's Master Password, not on keeping the algorithm or codebase obscure.
2. **No Telemetry / No Tracking**: The core vault does not collect any user activity or credential metadata.
3. **Local-First**: Complete functionality remains available 100% offline.

To report a vulnerability or security concern, please open a private GitHub Advisory or contact the maintainers directly.

---

## 🤝 Acknowledgments & Tooling

- Built with [Tauri v2](https://v2.tauri.app/), [React](https://react.dev/), and [Rust](https://www.rust-lang.org/).
- Developed with AI pair-programming assistance for architectural validation and cryptographic verification.

---

## 📄 License

This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)**. See the `LICENSE` file for details.
