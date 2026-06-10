import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { parseJson, toJson } from '../../lib/json.js';
import { getOwnedEventOrThrow } from '../events/events.service.js';
import type { SaveInvitationInput } from './invitations.schema.js';

function mapInvitation(inv: { design: string } & Record<string, unknown>) {
  return { ...inv, design: parseJson<Record<string, unknown>>(inv.design, {}) };
}

export const invitationService = {
  async get(ownerId: string, eventId: string) {
    await getOwnedEventOrThrow(eventId, ownerId);
    const inv = await prisma.invitation.findUnique({ where: { eventId } });
    if (!inv) {
      // Return an empty skeleton so the builder can start from scratch.
      return { eventId, design: {}, bodyText: null, templateId: null, status: 'DRAFT' };
    }
    return mapInvitation(inv);
  },

  async save(ownerId: string, eventId: string, input: SaveInvitationInput) {
    await getOwnedEventOrThrow(eventId, ownerId);

    if (input.templateId) {
      const tpl = await prisma.template.findFirst({
        where: { id: input.templateId, OR: [{ isPublic: true }, { creatorId: ownerId }] },
      });
      if (!tpl) throw ApiError.badRequest('Template not found or not accessible');
    }

    const designJson = input.design !== undefined ? toJson(input.design) : undefined;

    const inv = await prisma.invitation.upsert({
      where: { eventId },
      update: {
        ...(designJson !== undefined ? { design: designJson } : {}),
        ...(input.bodyText !== undefined ? { bodyText: input.bodyText } : {}),
        ...(input.templateId !== undefined ? { templateId: input.templateId } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
      create: {
        eventId,
        design: designJson ?? '{}',
        bodyText: input.bodyText ?? null,
        templateId: input.templateId ?? null,
        status: input.status ?? 'DRAFT',
      },
    });
    return mapInvitation(inv);
  },
};
