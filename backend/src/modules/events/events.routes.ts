import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { eventController } from './events.controller.js';
import { createEventSchema, listEventsQuery, updateEventSchema } from './events.schema.js';
import { guestsRouter } from '../guests/guests.routes.js';
import { invitationRouter } from '../invitations/invitations.routes.js';
import { messagingRouter } from '../messaging/messaging.routes.js';
import { remindersRouter } from '../reminders/reminders.routes.js';
import { analyticsRouter } from '../analytics/analytics.routes.js';

export const eventsRouter = Router();

// All event routes require authentication; tenancy is enforced in services.
eventsRouter.use(authenticate);

// Event CRUD
eventsRouter.get('/', validate({ query: listEventsQuery }), asyncHandler(eventController.list));
eventsRouter.post('/', validate({ body: createEventSchema }), asyncHandler(eventController.create));
eventsRouter.get('/:eventId', asyncHandler(eventController.get));
eventsRouter.patch('/:eventId', validate({ body: updateEventSchema }), asyncHandler(eventController.update));
eventsRouter.delete('/:eventId', asyncHandler(eventController.remove));

// Nested resources (mergeParams gives them access to :eventId)
eventsRouter.use('/:eventId/guests', guestsRouter);
eventsRouter.use('/:eventId/invitation', invitationRouter);
eventsRouter.use('/:eventId/messages', messagingRouter);
eventsRouter.use('/:eventId/reminders', remindersRouter);
eventsRouter.use('/:eventId/analytics', analyticsRouter);
