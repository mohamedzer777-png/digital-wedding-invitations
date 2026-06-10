import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { apiRouter } from './routes/index.js';

/** Builds and configures the Express application (no network listening here). */
export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // Security + parsing
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // Allow non-browser clients (curl, health checks, server-to-server,
        // WhatsApp webhooks) that send no Origin header, plus allowlisted origins.
        // Disallowed origins get no CORS headers (browser blocks) rather than a 500.
        callback(null, !origin || env.CORS_ORIGINS.includes(origin));
      },
      credentials: true,
    }),
  );
  // Webhook routes need the raw request body for signature verification.
  app.use('/api/webhooks', express.raw({ type: '*/*', limit: '1mb' }));
  // Increase JSON/urlencoded limits to allow larger invitation designs (images or big payloads).
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Observability
  app.use(pinoHttp({ logger }));

  // Rate limiting + API
  app.use('/api', apiLimiter, apiRouter);

  // Fallbacks
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
