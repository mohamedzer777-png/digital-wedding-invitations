import { prisma } from '../../config/prisma.js';
import { MessageStatus, MessageType, RsvpStatus } from '../../lib/enums.js';
import { logger } from '../../lib/logger.js';
import { buildInvitationBody, deliverMessage } from '../messaging/messaging.delivery.js';

function describeLead(offsetHours: number): string {
  if (offsetHours % 24 === 0) {
    const days = offsetHours / 24;
    return `${days} day${days === 1 ? '' : 's'}`;
  }
  return `${offsetHours} hour${offsetHours === 1 ? '' : 's'}`;
}

/**
 * Worker job: for each enabled reminder whose fire-time has arrived, create and
 * send REMINDER messages to non-declined guests — exactly once per window. The
 * `lastFiredAt` column is claimed atomically so a reminder can't double-fire.
 */
export async function fireDueReminders(
  now: Date = new Date(),
): Promise<{ fired: number; messages: number }> {
  // Only consider events that haven't happened yet.
  const reminders = await prisma.reminder.findMany({
    where: { enabled: true, event: { eventDate: { gt: now } } },
    include: { event: { select: { id: true, title: true, eventDate: true } } },
  });

  let fired = 0;
  let messages = 0;

  for (const reminder of reminders) {
    const eventDate = reminder.event.eventDate;
    if (!eventDate) continue;

    const fireAt = new Date(eventDate.getTime() - reminder.offsetHours * 3_600_000);
    if (now < fireAt) continue; // not time yet
    if (reminder.lastFiredAt && reminder.lastFiredAt >= fireAt) continue; // already fired this window

    // Atomically claim so concurrent ticks / a separate worker can't double-fire.
    const claim = await prisma.reminder.updateMany({
      where: { id: reminder.id, OR: [{ lastFiredAt: null }, { lastFiredAt: { lt: fireAt } }] },
      data: { lastFiredAt: now },
    });
    if (claim.count !== 1) continue;

    const guests = await prisma.guest.findMany({
      where: {
        eventId: reminder.event.id,
        rsvpStatus: { in: [RsvpStatus.PENDING, RsvpStatus.GOING, RsvpStatus.MAYBE] },
      },
      select: { id: true, name: true, rsvpToken: true },
    });
    const invitation = await prisma.invitation.findUnique({
      where: { eventId: reminder.event.id },
      select: { bodyText: true },
    });

    const reminderText = `Reminder: "${reminder.event.title}" is in ${describeLead(reminder.offsetHours)}!`;
    for (const guest of guests) {
      const body = buildInvitationBody(
        guest.name,
        guest.rsvpToken,
        reminder.event.title,
        invitation?.bodyText ?? null,
        reminderText,
      );
      const msg = await prisma.message.create({
        data: {
          eventId: reminder.event.id,
          guestId: guest.id,
          type: MessageType.REMINDER,
          status: MessageStatus.QUEUED,
          body,
        },
      });
      await deliverMessage(msg.id);
      messages++;
    }

    fired++;
    logger.info(
      { reminderId: reminder.id, eventId: reminder.event.id, offsetHours: reminder.offsetHours, guests: guests.length },
      'Fired reminder',
    );
  }

  if (fired) logger.info({ fired, messages }, 'Reminders fired');
  return { fired, messages };
}
