// ============================================================================
// File: passwordGen.ts
// Description: Cryptographically secure random password generator and Shannon
//              entropy calculation utilizing Web Crypto CSPRNG.
// ============================================================================

export interface GeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

export interface StrengthResult {
  entropy: number;
  score: 0 | 1 | 2 | 3 | 4; // 0: Very Weak, 1: Weak, 2: Fair, 3: Strong, 4: Very Strong
  label: string;
  colorClass: string;
}

const CHAR_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CHAR_LOWER = "abcdefghijklmnopqrstuvwxyz";
const CHAR_NUMBERS = "0123456789";
const CHAR_SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";

// ----------------------------------------------------------------------------
// 1. getRandomInt
// - Generates an unbiased random integer in the range [0, max - 1] via CSPRNG.
//
// Args:
//   - max: Exclusive upper bound for the random integer.
//
// Return:
//   - number: Securely generated random integer.
// ----------------------------------------------------------------------------
function getRandomInt(max: number): number {
  if (max <= 1) return 0;
  if (max > 256) {
    throw new Error("getRandomInt currently requires max <= 256 for Uint8Array CSPRNG sampling");
  }
  const range = 256 - (256 % max);
  const randomByte = new Uint8Array(1);

  // Rejection sampling to prevent modulo bias
  while (true) {
    window.crypto.getRandomValues(randomByte);
    if (randomByte[0] < range) {
      return randomByte[0] % max;
    }
  }
}

// ----------------------------------------------------------------------------
// 2. generatePassword
// - Generates a secure random password using Web Crypto CSPRNG with guaranteed sets.
//
// Args:
//   - options: Configuration options specifying length and character sets.
//
// Return:
//   - string: Generated cryptographic random password.
// ----------------------------------------------------------------------------
export function generatePassword(options: GeneratorOptions): string {
  // Step 1. Build character pool and guarantee at least one of each active set
  let pool = "";
  const guaranteedChars: string[] = [];

  if (options.uppercase) {
    pool += CHAR_UPPER;
    guaranteedChars.push(CHAR_UPPER[getRandomInt(CHAR_UPPER.length)] || CHAR_UPPER[0]);
  }
  if (options.lowercase) {
    pool += CHAR_LOWER;
    guaranteedChars.push(CHAR_LOWER[getRandomInt(CHAR_LOWER.length)] || CHAR_LOWER[0]);
  }
  if (options.numbers) {
    pool += CHAR_NUMBERS;
    guaranteedChars.push(CHAR_NUMBERS[getRandomInt(CHAR_NUMBERS.length)] || CHAR_NUMBERS[0]);
  }
  if (options.symbols) {
    pool += CHAR_SYMBOLS;
    guaranteedChars.push(CHAR_SYMBOLS[getRandomInt(CHAR_SYMBOLS.length)] || CHAR_SYMBOLS[0]);
  }

  // Fallback if no set is checked
  if (pool.length === 0) {
    pool = CHAR_LOWER + CHAR_NUMBERS;
    guaranteedChars.push(pool[getRandomInt(pool.length)]);
  }

  const length = Math.max(options.length, guaranteedChars.length);
  const passwordChars: string[] = [...guaranteedChars];

  // Step 2. Fill remaining characters from random pool
  for (let i = guaranteedChars.length; i < length; i++) {
    passwordChars.push(pool[getRandomInt(pool.length)]);
  }

  // Step 3. Fisher-Yates shuffle using CSPRNG to prevent guaranteed positions
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1);
    const temp = passwordChars[i];
    passwordChars[i] = passwordChars[j];
    passwordChars[j] = temp;
  }

  return passwordChars.join("");
}

// ----------------------------------------------------------------------------
// 3. calculatePasswordStrength
// - Computes password Shannon entropy bits and returns visual rating score.
//
// Args:
//   - password: Input password string to evaluate.
//
// Return:
//   - StrengthResult: Calculated entropy, numeric score, label, and style.
// ----------------------------------------------------------------------------
export function calculatePasswordStrength(password: string): StrengthResult {
  if (!password) {
    return { entropy: 0, score: 0, label: "Empty", colorClass: "bg-zinc-600" };
  }

  // Step 1. Determine size of character pool (R)
  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 33;

  if (poolSize === 0) poolSize = 26;

  // Step 2. Compute Entropy E = L * log2(R)
  const entropy = Math.round(password.length * Math.log2(poolSize));

  // Step 3. Map entropy to security tiers
  if (entropy < 36) {
    return { entropy, score: 1, label: "Very Weak", colorClass: "bg-red-500" };
  } else if (entropy < 50) {
    return { entropy, score: 2, label: "Weak", colorClass: "bg-orange-500" };
  } else if (entropy < 65) {
    return { entropy, score: 2, label: "Fair", colorClass: "bg-yellow-500" };
  } else if (entropy < 80) {
    return { entropy, score: 3, label: "Strong", colorClass: "bg-emerald-500" };
  } else {
    return { entropy, score: 4, label: "Very Strong", colorClass: "bg-cyan-500" };
  }
}
