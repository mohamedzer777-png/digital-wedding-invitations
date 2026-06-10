import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './config/prisma.js';
import { startScheduler, stopScheduler } from './scheduler.js';

async function main() {
  const app = createApp();

  // Bind to 0.0.0.0 (all interfaces) so the platform's health checker can reach
  // the service from outside the container, not just loopback. env.PORT reads
  // process.env.PORT (injected by Render) and falls back to its configured default.
  const server = app.listen(env.PORT, '0.0.0.0', () => {
    logger.info(`🚀 InviteFlow API listening on http://0.0.0.0:${env.PORT}/api`);
    logger.info(`   Environment: ${env.NODE_ENV}`);
  });

  // Run the background scheduler in-process unless a separate worker handles it
  // (set SCHEDULER=off on the API when running `npm run worker` separately).
  if (process.env.SCHEDULER !== 'off') startScheduler();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down...`);
    stopScheduler();
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Closed HTTP server and DB connections. Bye 👋');
      process.exit(0);
    });
    // Force-exit if shutdown hangs
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});
