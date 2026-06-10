import type { Request } from 'express';
import { ApiError } from '../lib/ApiError.js';

/**
 * Tenant isolation helper.
 *
 * Design: tenancy is enforced at the data-access layer — every service query is
 * filtered by the authenticated user's id. This helper centralizes reading that
 * id so no controller ever trusts a client-supplied `ownerId`.
 */
export function getTenantId(req: Request): string {
  if (!req.user) throw ApiError.unauthorized();
  return req.user.id;
}
