import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { rsvpController } from './rsvp.controller.js';
import { respondSchema } from './rsvp.schema.js';

// PUBLIC router — no JWT. Access is authorized by the unguessable :token.
export const rsvpRouter = Router();

rsvpRouter.get('/:token', asyncHandler(rsvpController.get));
rsvpRouter.post('/:token/respond', validate({ body: respondSchema }), asyncHandler(rsvpController.respond));
