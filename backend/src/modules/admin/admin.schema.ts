import { z } from 'zod';
import { RoleEnum, UserStatusEnum } from '../../lib/enums.js';

export const listUsersQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(RoleEnum.options).optional(),
  status: z.enum(UserStatusEnum.options).optional(),
});

export const updateUserSchema = z.object({
  role: z.enum(RoleEnum.options).optional(),
  status: z.enum(UserStatusEnum.options).optional(),
});

export const createPlanSchema = z.object({
  name: z.string().min(1),
  priceCents: z.coerce.number().int().min(0),
  currency: z.string().min(1).default('USD'),
  interval: z.enum(['month', 'year']).default('month'),
  maxEvents: z.coerce.number().int().min(1),
  maxGuests: z.coerce.number().int().min(1),
  features: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export const updatePlanSchema = createPlanSchema.partial();

export const listMessagesQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuery>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type ListMessagesQuery = z.infer<typeof listMessagesQuery>;
