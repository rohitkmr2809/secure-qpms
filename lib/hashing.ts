import crypto from 'crypto';

/**
 * Generates a SHA-256 cryptographic hash of a text string (question paper content).
 * Methodology Step 7: Integrity Verification
 *
 * @param content The plain text or canonical representation of the question paper.
 * @returns 64-character hexadecimal SHA-256 hash.
 */
export function generateSHA256(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Verifies document integrity by recomputing the SHA-256 hash and comparing with the stored hash.
 * Uses timingSafeEqual to protect against timing attacks.
 *
 * @param content Current document content
 * @param expectedHash Stored hash from database
 * @returns boolean indicating if the document is intact and untampered
 */
export function verifySHA256(content: string, expectedHash: string): boolean {
  if (!content || !expectedHash) return false;
  const currentHash = generateSHA256(content);
  try {
    const hashBuf = Buffer.from(currentHash, 'hex');
    const expectedBuf = Buffer.from(expectedHash, 'hex');
    if (hashBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(hashBuf, expectedBuf);
  } catch {
    return currentHash.toLowerCase() === expectedHash.toLowerCase();
  }
}
