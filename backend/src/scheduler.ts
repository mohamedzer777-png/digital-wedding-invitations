import { logger } from './lib/logger.js';
import { deliverDueScheduledMessages } from './modules/messaging/messaging.delivery.js';
import { fireDueReminders } from './modules/reminders/reminders.scheduler.js';

/**
 * Redis-free background scheduler. Polls the database on an interval and runs the
 * background jobs: deliver due scheduled messages, then fire due reminders.
 *
 * This is a single-instance pattern that needs no extra infrastructure. To scale
 * horizontally later, swap this for BullMQ + Redis — the job functions in
 * messaging.delivery.ts / reminders.scheduler.ts stay exactly the same.
 */
const POLL_MS = Number(process.env.WORKER_POLL_MS ?? 30_000);

let timer: NodeJS.Timeout | null = null;
let ticking = false;

/** One polling cycle. Guarded so cycles never overlap. */
export async function runSchedulerOnce(): Promise<void> {
  if (ticking) return;
  ticking = true;
  try {
    await deliverDueScheduledMessages();
    await fireDueReminders();
  } catch (err) {
    logger.error({ err }, 'Scheduler tick failed');
  } finally {
    ticking = false;
  }
}

/** Starts the polling scheduler (idempotent). */
export function startScheduler(): void {
  if (timer) return;
  logger.info(`⏱️  Scheduler started — polling every ${POLL_MS}ms (Redis-free)`);
  void runSchedulerOnce(); // run once immediately
  timer = setInterval(() => void runSchedulerOnce(), POLL_MS);
}

/** Stops the polling scheduler. */
export function stopScheduler(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
