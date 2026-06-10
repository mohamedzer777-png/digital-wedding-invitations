import { prisma } from './config/prisma.js';
import { logger } from './lib/logger.js';
import { startScheduler, stopScheduler } from './scheduler.js';

/**
 * Standalone worker process. Runs the same Redis-free scheduler used optionally
 * in-process by the API. Run it separately (`npm run worker`) when you want the
 * background jobs decoupled from the API — and set `SCHEDULER=off` on the API so
 * jobs aren't processed twice.
 */
async function main() {
  logger.info('⚙️  InviteFlow worker starting (standalone scheduler)');
  startScheduler();

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — stopping worker...`);
    stopScheduler();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error({ err }, 'Worker failed to start');
  process.exit(1);
});
