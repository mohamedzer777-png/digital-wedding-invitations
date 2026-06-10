import type { NextFunction, Request, Response } from 'express';
import type { Role } from '../lib/enums.js';
import { ApiError } from '../lib/ApiError.js';

/**
 * Role-based access guard. Use after `authenticate`.
 *   router.use(authenticate, requireRole('ADMIN'))
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden('Insufficient permissions');
    }
    next();
  };
}
