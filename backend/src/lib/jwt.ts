import jwt, { type SignOptions } from 'jsonwebtoken';
import type { Role } from './enums.js';
import { env } from '../config/env.js';

export interface AccessTokenPayload {
  sub: string; // user id
  email: string;
  role: Role;
}

// env TTLs are strings like "15m"/"7d"; cast to the union jsonwebtoken expects.
const accessTtl = env.JWT_ACCESS_TTL as SignOptions['expiresIn'];
const refreshTtl = env.JWT_REFRESH_TTL as SignOptions['expiresIn'];

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: accessTtl });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function signRefreshToken(payload: { sub: string }): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: refreshTtl });
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string };
}

/** Reads the `exp` claim of a signed token and returns it as a Date. */
export function getTokenExpiry(token: string): Date {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  if (!decoded?.exp) {
    // Fallback: 7 days out (should not happen for our signed tokens).
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  return new Date(decoded.exp * 1000);
}
