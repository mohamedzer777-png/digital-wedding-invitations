import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../lib/ApiError.js';
import { verifyAccessToken } from '../lib/jwt.js';

/**
 * Requires a valid Bearer access token. Populates `req.user`.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing or malformed Authorization header');
  }

  const token = header.slice('Bearer '.length).trim();
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    throw ApiError.unauthorized('Invalid or expired access token');
  }
}
