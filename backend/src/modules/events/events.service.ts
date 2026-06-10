import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import type { CreateEventInput, UpdateEventInput } from './events.schema.js';

/**
 * Loads an event scoped to its owner, or throws 404. This is the central
 * tenant-isolation check reused by every nested module (guests, invitation,
 * messaging, reminders, analytics).
 */
export async function getOwnedEventOrThrow(eventId: string, ownerId: string) {
  const event = await prisma.event.findFirst({ where: { id: eventId, ownerId } });
  if (!event) throw ApiError.notFound('Event not found');
  return event;
}

export const eventService = {
  async list(ownerId: string, filter: { status?: string }) {
    return prisma.event.findMany({
      where: { ownerId, ...(filter.status ? { status: filter.status } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { guests: true, messages: true } } },
    });
  },

  async create(ownerId: string, input: CreateEventInput) {
    return prisma.event.create({
      data: { ...input, ownerId },
    });
  },

  async getById(ownerId: string, eventId: string) {
    await getOwnedEventOrThrow(eventId, ownerId);
    return prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: { select: { guests: true, messages: true, reminders: true } },
        invitation: true,
      },
    });
  },

  async update(ownerId: string, eventId: string, input: UpdateEventInput) {
    await getOwnedEventOrThrow(eventId, ownerId);
    return prisma.event.update({ where: { id: eventId }, data: input });
  },

  async remove(ownerId: string, eventId: string) {
    await getOwnedEventOrThrow(eventId, ownerId);
    // Explicit, ordered deletes inside a transaction: several child FKs use
    // NoAction (Invitation→Event, Message→Guest, AnalyticsEvent→Guest), so we
    // cannot rely on a single cascade and must clear dependents in order.
    await prisma.$transaction([
      prisma.analyticsEvent.deleteMany({ where: { eventId } }),
      prisma.message.deleteMany({ where: { eventId } }),
      prisma.invitation.deleteMany({ where: { eventId } }),
      prisma.reminder.deleteMany({ where: { eventId } }),
      prisma.guest.deleteMany({ where: { eventId } }),
      prisma.event.delete({ where: { id: eventId } }),
    ]);
    return { success: true };
  },
};
