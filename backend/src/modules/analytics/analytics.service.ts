import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { getOwnedEventOrThrow } from '../events/events.service.js';
import type { AnalyticsTimelineQuery } from './analytics.schema.js';
import { AnalyticsType, MessageStatus, RsvpStatus } from '../../lib/enums.js';

export const analyticsService = {
  async summary(ownerId: string, eventId: string) {
    await getOwnedEventOrThrow(eventId, ownerId);

    const [guests, messages, events] = await Promise.all([
      prisma.guest.groupBy({
        by: ['rsvpStatus'],
        where: { eventId },
        _count: { _all: true },
      }),
      prisma.message.groupBy({
        by: ['status'],
        where: { eventId },
        _count: { _all: true },
      }),
      prisma.analyticsEvent.groupBy({
        by: ['type'],
        where: { eventId },
        _count: { _all: true },
      }),
    ]);

    const getCount = (rows: { rsvpStatus?: string; status?: string; type?: string; _count: { _all: number } }[], key: string | undefined, field: 'rsvpStatus' | 'status' | 'type') =>
      rows.find((row) => row[field] === key)?._count._all ?? 0;

    const going = getCount(guests, RsvpStatus.GOING, 'rsvpStatus');
    const notGoing = getCount(guests, RsvpStatus.NOT_GOING, 'rsvpStatus');
    const maybe = getCount(guests, RsvpStatus.MAYBE, 'rsvpStatus');
    const pending = getCount(guests, RsvpStatus.PENDING, 'rsvpStatus');

    const delivered = getCount(messages, MessageStatus.DELIVERED, 'status');
    const read = getCount(messages, MessageStatus.READ, 'status');
    const sent = getCount(messages, MessageStatus.SENT, 'status');
    const failed = getCount(messages, MessageStatus.FAILED, 'status');

    const opened = getCount(events, AnalyticsType.INVITATION_OPENED, 'type');
    const rsvpClicked = getCount(events, AnalyticsType.RSVP_CLICKED, 'type');

    return {
      guests: { total: guests.reduce((sum, row) => sum + row._count._all, 0), going, notGoing, maybe, pending },
      messages: { sent, delivered, read, failed },
      engagement: {
        opened,
        rsvpClicked,
        openRate: sent > 0 ? Number(((opened / sent) * 100).toFixed(1)) : 0,
        responseRate: guests.length > 0 ? Number(((going + notGoing + maybe) / guests.reduce((sum, row) => sum + row._count._all, 0) * 100).toFixed(1)) : 0,
      },
    };
  },

  async timeline(ownerId: string, eventId: string, query: AnalyticsTimelineQuery) {
    await getOwnedEventOrThrow(eventId, ownerId);
    const since = new Date(Date.now() - query.days * 24 * 60 * 60 * 1000);

    const events = await prisma.analyticsEvent.findMany({
      where: { eventId, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
    });

    const timelineMap = new Map<string, { date: string; opened: number; rsvpClicked: number; messagesSent: number }>();

    for (const event of events) {
      const date = event.createdAt.toISOString().slice(0, 10);
      const entry = timelineMap.get(date) ?? { date, opened: 0, rsvpClicked: 0, messagesSent: 0 };
      if (event.type === AnalyticsType.INVITATION_OPENED) entry.opened += 1;
      if (event.type === AnalyticsType.RSVP_CLICKED) entry.rsvpClicked += 1;
      if (event.type === AnalyticsType.MESSAGE_SENT) entry.messagesSent += 1;
      timelineMap.set(date, entry);
    }

    const timeline = [...timelineMap.values()];
    return { timeline };
  },
};
