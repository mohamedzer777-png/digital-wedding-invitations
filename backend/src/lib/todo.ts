import type { Request, Response } from 'express';
import { ApiError } from './ApiError.js';

/**
 * Placeholder controller for endpoints scaffolded in Phase 1 and implemented in
 * Phase 2. Returns a clean 501 so the API surface is navigable today.
 */
export const todo = (name: string) => (_req: Request, _res: Response) => {
  throw ApiError.notImplemented(`${name} — implemented in Phase 2`);
};
