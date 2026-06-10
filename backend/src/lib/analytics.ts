import { prisma } from '../config/prisma.js';
import { toJson } from './json.js';
import { logger } from './logger.js';
import type { AnalyticsType } from './enums.js';

/**
 * Records a tracking event. Analytics is best-effort: a failure here must never
 * break the user-facing request, so errors are logged and swallowed.
 */
export async function recordAnalytics(
  eventId: string,
  type: AnalyticsType,
  opts: { guestId?: string | null; metadata?: Record<string, unknown> } = {},
): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: {
        eventId,
        type,
        guestId: opts.guestId ?? null,
        metadata: toJson(opts.metadata ?? {}),
      },
    });
  } catch (err) {
    logger.warn({ err, eventId, type }, 'Failed to record analytics event');
  }
}
