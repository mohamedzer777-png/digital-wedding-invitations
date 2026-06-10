import { prisma } from '../../config/prisma.js';
import { getOwnedEventOrThrow } from '../events/events.service.js';
import type { ConfigureRemindersInput } from './reminders.schema.js';

export const reminderService = {
  async list(ownerId: string, eventId: string) {
    await getOwnedEventOrThrow(eventId, ownerId);
    return prisma.reminder.findMany({ where: { eventId }, orderBy: { offsetHours: 'desc' } });
  },

  /** Replaces the full set of reminder rules for an event. */
  async configure(ownerId: string, eventId: string, input: ConfigureRemindersInput) {
    await getOwnedEventOrThrow(eventId, ownerId);

    // Dedupe by offsetHours (the [eventId, offsetHours] unique constraint) — last wins.
    const byOffset = new Map<number, boolean>();
    for (const r of input.reminders) byOffset.set(r.offsetHours, r.enabled);
    const rows = [...byOffset].map(([offsetHours, enabled]) => ({ eventId, offsetHours, enabled }));

    const ops = [prisma.reminder.deleteMany({ where: { eventId } })];
    if (rows.length > 0) ops.push(prisma.reminder.createMany({ data: rows }));
    await prisma.$transaction(ops);

    return prisma.reminder.findMany({ where: { eventId }, orderBy: { offsetHours: 'desc' } });
  },
};
