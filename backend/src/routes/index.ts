import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authRouter } from '../modules/auth/auth.routes.js';
import { eventsRouter } from '../modules/events/events.routes.js';
import { templatesRouter } from '../modules/templates/templates.routes.js';
import { rsvpRouter } from '../modules/rsvp/rsvp.routes.js';
import { aiRouter } from '../modules/ai/ai.routes.js';
import { webhooksRouter } from '../modules/webhooks/webhooks.routes.js';
import { adminRouter } from '../modules/admin/admin.routes.js';

export const apiRouter = Router();

// Liveness + DB readiness probe
apiRouter.get(
  '/health',
  asyncHandler(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', time: new Date().toISOString() });
  }),
);

// Feature modules
apiRouter.use('/auth', authRouter);
apiRouter.use('/events', eventsRouter); // nests guests, invitation, messages, reminders, analytics
apiRouter.use('/templates', templatesRouter);
apiRouter.use('/rsvp', rsvpRouter); // public
apiRouter.use('/ai', aiRouter);
apiRouter.use('/webhooks', webhooksRouter); // public
apiRouter.use('/admin', adminRouter);
