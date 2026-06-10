import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { parseJson, toJson } from '../../lib/json.js';
import type { CreateTemplateInput } from './templates.schema.js';

function mapTemplate<T extends { design: string }>(t: T) {
  return { ...t, design: parseJson<Record<string, unknown>>(t.design, {}) };
}

export const templateService = {
  /** Public (system) templates + templates created by this user. */
  async list(ownerId: string) {
    const templates = await prisma.template.findMany({
      where: { OR: [{ isPublic: true }, { creatorId: ownerId }] },
      orderBy: [{ isPublic: 'desc' }, { createdAt: 'desc' }],
    });
    return templates.map(mapTemplate);
  },

  async create(ownerId: string, input: CreateTemplateInput) {
    const tpl = await prisma.template.create({
      data: {
        name: input.name,
        category: input.category,
        design: toJson(input.design),
        thumbnail: input.thumbnail ?? null,
        isPublic: false, // regular users create private templates only
        creatorId: ownerId,
      },
    });
    return mapTemplate(tpl);
  },

  async get(ownerId: string, templateId: string) {
    const tpl = await prisma.template.findFirst({
      where: { id: templateId, OR: [{ isPublic: true }, { creatorId: ownerId }] },
    });
    if (!tpl) throw ApiError.notFound('Template not found');
    return mapTemplate(tpl);
  },
};
