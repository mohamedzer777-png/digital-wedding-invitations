import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { toJson } from '../../lib/json.js';
import type { CreatePlanInput, ListMessagesQuery, ListUsersQuery, UpdatePlanInput, UpdateUserInput } from './admin.schema.js';

function formatPlan(plan: { features: string } & Record<string, unknown>) {
  return { ...plan, features: JSON.parse(plan.features) };
}

export const adminService = {
  async listUsers(query: ListUsersQuery) {
    const where: Record<string, unknown> = {};
    if (query.role) where.role = query.role;
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          subscription: { select: { status: true, plan: { select: { name: true } } } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  },

  async updateUser(userId: string, input: UpdateUserInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('User not found');
    const data: { role?: string; status?: string } = {};
    if (input.role !== undefined) data.role = input.role;
    if (input.status !== undefined) data.status = input.status;
    return prisma.user.update({ where: { id: userId }, data });
  },

  async listPlans() {
    const plans = await prisma.plan.findMany({ orderBy: { priceCents: 'asc' } });
    return plans.map(formatPlan);
  },

  async createPlan(input: CreatePlanInput) {
    const plan = await prisma.plan.create({
      data: {
        name: input.name,
        priceCents: input.priceCents,
        currency: input.currency,
        interval: input.interval,
        maxEvents: input.maxEvents,
        maxGuests: input.maxGuests,
        features: toJson(input.features),
        isActive: input.isActive,
      },
    });
    return formatPlan(plan);
  },

  async updatePlan(planId: string, input: UpdatePlanInput) {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw ApiError.notFound('Plan not found');
    const updated = await prisma.plan.update({
      where: { id: planId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.priceCents !== undefined ? { priceCents: input.priceCents } : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.interval !== undefined ? { interval: input.interval } : {}),
        ...(input.maxEvents !== undefined ? { maxEvents: input.maxEvents } : {}),
        ...(input.maxGuests !== undefined ? { maxGuests: input.maxGuests } : {}),
        ...(input.features !== undefined ? { features: toJson(input.features) } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });
    return formatPlan(updated);
  },

  async listTemplates() {
    return prisma.template.findMany({
      orderBy: [{ isPublic: 'desc' }, { createdAt: 'desc' }],
      include: { creator: { select: { id: true, name: true, email: true } } },
    });
  },

  async listMessages(query: ListMessagesQuery) {
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    const [items, total] = await Promise.all([
      prisma.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: { event: { select: { title: true } }, guest: { select: { name: true, phone: true } } },
      }),
      prisma.message.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  },

  async systemAnalytics() {
    const [users, events, messages, guests] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.message.count(),
      prisma.guest.count(),
    ]);
    return { users, events, messages, guests };
  },
};
