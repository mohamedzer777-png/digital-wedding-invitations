import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { parseJson } from '../../lib/json.js';
import { recordAnalytics } from '../../lib/analytics.js';
import { AnalyticsType } from '../../lib/enums.js';
import type { RespondInput } from './rsvp.schema.js';

export const rsvpService = {
  /** Public: fetch the invitation + current RSVP for a guest by their token. */
  async getByToken(token: string) {
    const guest = await prisma.guest.findUnique({
      where: { rsvpToken: token },
      include: { event: { include: { invitation: true } } },
    });
    if (!guest) throw ApiError.notFound('Invitation not found');

    await recordAnalytics(guest.eventId, AnalyticsType.INVITATION_OPENED, { guestId: guest.id });

    const { event } = guest;
    return {
      event: {
        title: event.title,
        type: event.type,
        eventDate: event.eventDate,
        venue: event.venue,
        location: event.location,
        timezone: event.timezone,
      },
      invitation: event.invitation
        ? {
            design: parseJson<Record<string, unknown>>(event.invitation.design, {}),
            bodyText: event.invitation.bodyText,
            status: event.invitation.status,
          }
        : null,
      guest: {
        name: guest.name,
        partySize: guest.partySize,
        rsvpStatus: guest.rsvpStatus,
        respondedAt: guest.respondedAt,
      },
    };
  },

  /** Public: submit/update an RSVP response. */
  async respond(token: string, input: RespondInput) {
    const guest = await prisma.guest.findUnique({ where: { rsvpToken: token } });
    if (!guest) throw ApiError.notFound('Invitation not found');

    const updated = await prisma.guest.update({
      where: { id: guest.id },
      data: {
        rsvpStatus: input.status,
        ...(input.partySize !== undefined ? { partySize: input.partySize } : {}),
        respondedAt: new Date(),
      },
    });

    await recordAnalytics(guest.eventId, AnalyticsType.RSVP_CLICKED, {
      guestId: guest.id,
      metadata: { status: input.status, partySize: updated.partySize },
    });

    return {
      rsvpStatus: updated.rsvpStatus,
      partySize: updated.partySize,
      respondedAt: updated.respondedAt,
    };
  },
};
