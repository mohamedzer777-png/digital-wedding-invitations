import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../lib/ApiError.js';
import { recordAnalytics } from '../../lib/analytics.js';
import { AnalyticsType, MessageStatus } from '../../lib/enums.js';
import { getOwnedEventOrThrow } from '../events/events.service.js';
import { whatsappProvider } from './whatsapp.provider.js';
import type { ListMessagesQuery, ScheduleInput, SendInput } from './messaging.schema.js';

interface GuestForMessage {
  id: string;
  name: string;
  phone: string;
  rsvpToken: string;
}

/** Builds the WhatsApp message text including the guest's personal RSVP link. */
function buildBody(
  guest: GuestForMessage,
  eventTitle: string,
  invitationText: string | null,
  override?: string,
): string {
  const link = `${env.APP_URL}/rsvp/${guest.rsvpToken}`;
  const core = override ?? invitationText ?? `You're invited to ${eventTitle}!`;
  return `Hi ${guest.name},\n\n${core}\n\nPlease RSVP here: ${link}`;
}

/** Loads the target guests for an event (all, or the requested subset). */
async function loadTargetGuests(eventId: string, guestIds?: string[]): Promise<GuestForMessage[]> {
  const guests = await prisma.guest.findMany({
    where: { eventId, ...(guestIds?.length ? { id: { in: guestIds } } : {}) },
    select: { id: true, name: true, phone: true, rsvpToken: true },
  });
  if (guests.length === 0) throw ApiError.badRequest('No guests to message');
  return guests;
}

export const messagingService = {
  /**
   * Sends invitations now. Phase 4 will enqueue BullMQ jobs instead of calling
   * the provider inline; for Phases 2–3 the mock provider returns immediately.
   */
  async send(ownerId: string, eventId: string, input: SendInput) {
    const event = await getOwnedEventOrThrow(eventId, ownerId);
    const invitation = await prisma.invitation.findUnique({ where: { eventId } });
    const guests = await loadTargetGuests(eventId, input.guestIds);

    let sent = 0;
    let failed = 0;

    for (const guest of guests) {
      const body = buildBody(guest, event.title, invitation?.bodyText ?? null, input.body);
      const message = await prisma.message.create({
        data: { eventId, guestId: guest.id, type: input.type, status: MessageStatus.QUEUED, body },
      });

      try {
        const { providerMsgId } = await whatsappProvider.sendText(guest.phone, body);
        await prisma.message.update({
          where: { id: message.id },
          data: { status: MessageStatus.SENT, sentAt: new Date(), providerMsgId },
        });
        await recordAnalytics(eventId, AnalyticsType.MESSAGE_SENT, {
          guestId: guest.id,
          metadata: { messageId: message.id },
        });
        sent++;
      } catch (err) {
        await prisma.message.update({
          where: { id: message.id },
          data: { status: MessageStatus.FAILED, error: String(err), retryCount: { increment: 1 } },
        });
        await recordAnalytics(eventId, AnalyticsType.MESSAGE_FAILED, { guestId: guest.id });
        failed++;
      }
    }

    return { total: guests.length, sent, failed };
  },

  /** Queues messages to be delivered at `scheduledAt` (picked up by the Phase 4 worker). */
  async schedule(ownerId: string, eventId: string, input: ScheduleInput) {
    const event = await getOwnedEventOrThrow(eventId, ownerId);
    const invitation = await prisma.invitation.findUnique({ where: { eventId } });
    const guests = await loadTargetGuests(eventId, input.guestIds);

    await prisma.message.createMany({
      data: guests.map((guest) => ({
        eventId,
        guestId: guest.id,
        type: input.type,
        status: MessageStatus.SCHEDULED,
        scheduledAt: input.scheduledAt,
        body: buildBody(guest, event.title, invitation?.bodyText ?? null, input.body),
      })),
    });

    return { scheduled: guests.length, scheduledAt: input.scheduledAt };
  },

  async list(ownerId: string, eventId: string, query: ListMessagesQuery) {
    await getOwnedEventOrThrow(eventId, ownerId);
    const where = { eventId, ...(query.status ? { status: query.status } : {}) };
    const [items, total] = await Promise.all([
      prisma.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: { guest: { select: { name: true, phone: true } } },
      }),
      prisma.message.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  },

  async retry(ownerId: string, eventId: string, messageId: string) {
    await getOwnedEventOrThrow(eventId, ownerId);
    const message = await prisma.message.findFirst({
      where: { id: messageId, eventId },
      include: { guest: { select: { phone: true } } },
    });
    if (!message) throw ApiError.notFound('Message not found');
    if (message.status !== MessageStatus.FAILED) {
      throw ApiError.badRequest('Only failed messages can be retried');
    }

    try {
      const { providerMsgId } = await whatsappProvider.sendText(message.guest.phone, message.body ?? '');
      return prisma.message.update({
        where: { id: message.id },
        data: { status: MessageStatus.SENT, sentAt: new Date(), providerMsgId, error: null },
      });
    } catch (err) {
      return prisma.message.update({
        where: { id: message.id },
        data: { status: MessageStatus.FAILED, error: String(err), retryCount: { increment: 1 } },
      });
    }
  },
};
