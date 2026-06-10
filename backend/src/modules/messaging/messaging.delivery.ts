import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { recordAnalytics } from '../../lib/analytics.js';
import { AnalyticsType, MessageStatus } from '../../lib/enums.js';
import { logger } from '../../lib/logger.js';
import { whatsappProvider } from './whatsapp.provider.js';

/** Builds an RSVP-link message body (shared by the API and the worker). */
export function buildInvitationBody(
  guestName: string,
  rsvpToken: string,
  eventTitle: string,
  invitationText?: string | null,
  override?: string,
): string {
  const link = `${env.APP_URL}/rsvp/${rsvpToken}`;
  const core = override ?? invitationText ?? `You're invited to ${eventTitle}!`;
  return `Hi ${guestName},\n\n${core}\n\nPlease RSVP here: ${link}`;
}

/** Sends one persisted message row via the provider and updates status + analytics. */
export async function deliverMessage(messageId: string): Promise<'SENT' | 'FAILED'> {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { guest: { select: { phone: true } } },
  });
  if (!message) return 'FAILED';

  try {
    const { providerMsgId } = await whatsappProvider.sendText(message.guest.phone, message.body ?? '');
    await prisma.message.update({
      where: { id: messageId },
      data: { status: MessageStatus.SENT, sentAt: new Date(), providerMsgId, error: null },
    });
    await recordAnalytics(message.eventId, AnalyticsType.MESSAGE_SENT, {
      guestId: message.guestId,
      metadata: { messageId },
    });
    return 'SENT';
  } catch (err) {
    await prisma.message.update({
      where: { id: messageId },
      data: { status: MessageStatus.FAILED, error: String(err), retryCount: { increment: 1 } },
    });
    await recordAnalytics(message.eventId, AnalyticsType.MESSAGE_FAILED, { guestId: message.guestId });
    logger.warn({ err, messageId }, 'Failed to deliver message');
    return 'FAILED';
  }
}

/**
 * Worker job: deliver every SCHEDULED message whose time has arrived. Each row is
 * atomically "claimed" (SCHEDULED → QUEUED) before sending, so overlapping ticks
 * (or a separate worker + inline scheduler) never double-send the same message.
 */
export async function deliverDueScheduledMessages(
  now: Date = new Date(),
): Promise<{ processed: number; sent: number; failed: number }> {
  const due = await prisma.message.findMany({
    where: { status: MessageStatus.SCHEDULED, scheduledAt: { lte: now } },
    select: { id: true },
    take: 500,
  });

  let sent = 0;
  let failed = 0;
  for (const { id } of due) {
    const claim = await prisma.message.updateMany({
      where: { id, status: MessageStatus.SCHEDULED },
      data: { status: MessageStatus.QUEUED },
    });
    if (claim.count !== 1) continue; // another tick already took it
    const result = await deliverMessage(id);
    if (result === 'SENT') sent++;
    else failed++;
  }

  if (due.length) logger.info({ processed: due.length, sent, failed }, 'Delivered scheduled messages');
  return { processed: due.length, sent, failed };
}
