import type { Role } from '../lib/enums.js';

/**
 * Augment Express's Request with the authenticated user (set by auth middleware).
 */
declare global {
  namespace Express {
    interface AuthUser {
      id: string;
      email: string;
      role: Role;
    }
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
