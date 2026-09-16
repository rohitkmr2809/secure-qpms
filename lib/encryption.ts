import crypto from 'crypto';

/**
 * AES-256-GCM Encryption & Decryption Module
 * Methodology Step 4: Encryption and Secure Storage
 *
 * Provides authenticated confidentiality at rest for sensitive question paper content.
 * Format of encrypted payload: iv:authTag:ciphertext (Hex encoded)
 */

function getDerivedKey(): Buffer {
  const rawSecret = process.env.ENCRYPTION_KEY || 'default_qpms_demo_secret_key_32bytes!!';
  // Ensure exactly 32 bytes (256 bits) for AES-256
  return crypto.createHash('sha256').update(rawSecret).digest();
}

/**
 * Encrypts plain text content using AES-256-GCM.
 *
 * @param plainText The unencrypted question paper content
 * @returns Serialized string: "<iv_hex>:<authTag_hex>:<cipherText_hex>"
 */
export function encryptContent(plainText: string): string {
  if (!plainText) return '';

  const key = getDerivedKey();
  const iv = crypto.randomBytes(12); // Standard 12-byte IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');
  const ivHex = iv.toString('hex');

  return `${ivHex}:${authTag}:${encrypted}`;
}

/**
 * Decrypts AES-256-GCM encrypted payload back to plain text.
 *
 * @param encryptedPayload Serialized string: "<iv_hex>:<authTag_hex>:<cipherText_hex>"
 * @returns Plain text content
 */
export function decryptContent(encryptedPayload: string): string {
  if (!encryptedPayload) return '';

  // If payload does not contain separators, it might be legacy plaintext during initial seed/fallback
  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    return encryptedPayload;
  }

  const [ivHex, authTagHex, cipherTextHex] = parts;
  const key = getDerivedKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherTextHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
