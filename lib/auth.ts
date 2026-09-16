import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export type Role = 'ADMIN' | 'QUESTION_SETTER' | 'REVIEWER' | 'EXAM_OFFICER';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

const AUTH_SECRET = process.env.AUTH_SECRET || 'qpms_super_secret_session_key_college_microproject';
export const SESSION_COOKIE_NAME = 'qpms_token';

/**
 * Hash password using bcrypt (Methodology Step 2: Strong Authentication)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare plain password with stored bcrypt hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Sign JWT session token
 */
export function signSessionToken(payload: SessionUser): string {
  return jwt.sign(payload, AUTH_SECRET, { expiresIn: '7d' });
}

/**
 * Verify JWT token
 */
export function verifySessionToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, AUTH_SECRET) as SessionUser;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Get current authenticated user from request cookies (Server Component / Route Handler)
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Helper to enforce RBAC in Server Route Handlers
 * Methodology Step 5: Role-Based Access Control
 */
export function hasRequiredRole(user: SessionUser | null, allowedRoles: Role[]): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}
