import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';
import { ApiError } from '../lib/ApiError.js';
import { logger } from '../lib/logger.js';

interface Schemas {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
}

/**
 * Validates and coerces request parts against Zod schemas. On success, the parsed
 * values replace the originals (so controllers get typed, trimmed input).
 */
export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query) Object.assign(req.query, schemas.query.parse(req.query));
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        logger.warn({ details: err.flatten() }, 'Request validation failed');
        throw ApiError.badRequest('Validation failed', err.flatten());
      }
      throw err;
    }
  };
}
