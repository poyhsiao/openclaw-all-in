import crypto from 'crypto';

/**
 * Encryption utilities for secret management
 * Uses AES-256-GCM for authenticated encryption
 */

// Get encryption key from environment (32 bytes for AES-256)
// Use ENC_KEY env var in production, fallback to development key
const ENCRYPTION_KEY = (() => {
  if (process.env.ENC_KEY) {
    const decoded = Buffer.from(process.env.ENC_KEY, 'base64');

    // Validate that process.env.ENC_KEY decodes to exactly 32 bytes (AES-256)
    if (decoded.length !== 32) {
      throw new Error(
        `Invalid ENC_KEY: decoded buffer length is ${decoded.length} bytes, expected 32 bytes (AES-256). ` +
        'Generate a valid key with: openssl rand -base64 32'
      );
    }
    return decoded;
  }

  // Only allow hardcoded fallback in development/test environments
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    return Buffer.from('development-key-32-bytes-long!!', 'utf8');
  }

  // Fail loudly in production
  throw new Error(
    'ENC_KEY environment variable is required in production. ' +
    'Generate one with: openssl rand -base64 32'
  );
})();

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for GCM IV
const SALT_LENGTH = 16; // 16 bytes for salt
const TAG_LENGTH = 16; // 16 bytes for GCM auth tag
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_DATA_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * Encrypt a plaintext value
 * @param plaintext The value to encrypt
 * @returns Base64-encoded encrypted string
 */
export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);

  // Derive key using PBKDF2
  const key = crypto.pbkdf2Sync(
    ENCRYPTION_KEY,
    salt,
    100000, // iterations
    32, // derived key length
    'sha256'
  );

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'binary');
  encrypted += cipher.final('binary');

  const tag = cipher.getAuthTag();

  // Combine salt + iv + tag + encrypted data
  const combined = Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'binary')]);

  return combined.toString('base64');
}

/**
 * Decrypt an encrypted value
 * @param ciphertext Base64-encoded encrypted string
 * @returns Decrypted plaintext
 * @throws Error if decryption fails (invalid key, data corrupted, etc.)
 */
export function decrypt(ciphertext: string): string {
  const combined = Buffer.from(ciphertext, 'base64');

  if (combined.length < ENCRYPTED_DATA_POSITION) {
    throw new Error('Invalid ciphertext: too short');
  }

  const salt = combined.subarray(0, SALT_LENGTH);
  const iv = combined.subarray(SALT_LENGTH, TAG_POSITION);
  const tag = combined.subarray(TAG_POSITION, ENCRYPTED_DATA_POSITION);
  const encrypted = combined.subarray(ENCRYPTED_DATA_POSITION);

  // Derive key using same PBKDF2 parameters
  const key = crypto.pbkdf2Sync(
    ENCRYPTION_KEY,
    salt,
    100000,
    32,
    'sha256'
  );

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, 'binary', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Check if a value appears to be encrypted
 * @param value The value to check
 * @returns True if value is likely encrypted (valid base64 of expected length)
 */
export function isEncrypted(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();

  // Strict base64 pattern: A-Za-z0-9+/ with padding = or ==
  const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;
  if (!base64Pattern.test(trimmed) || trimmed.length % 4 !== 0) {
    return false;
  }

  try {
    const decoded = Buffer.from(trimmed, 'base64');

    // Verify the encoded bytes match the expected format
    // by re-encoding and comparing
    const reencoded = decoded.toString('base64');

    // Account for base64 padding normalization
    const normalized = trimmed.replace(/={1,2}$/, '');
    const normalizedReencoded = reencoded.replace(/={1,2}$/, '');

    return normalized === normalizedReencoded && decoded.length >= ENCRYPTED_DATA_POSITION;
  } catch {
    return false;
  }
}
