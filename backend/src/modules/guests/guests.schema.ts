import { z } from 'zod';
import { RsvpStatusEnum } from '../../lib/enums.js';

const phone = z
  .string()
  .trim()
  .min(5)
  .max(30)
  .regex(/^\+?[0-9][0-9\s\-()]*$/, 'Invalid phone number');

export const createGuestSchema = z.object({
  name: z.string().min(1).max(150).trim(),
  phone,
  email: z.string().email().max(255).trim().optional(),
  groupLabel: z.string().max(100).trim().optional(),
  partySize: z.coerce.number().int().min(1).max(50).default(1),
  notes: z.string().max(2000).trim().optional(),
});

export const updateGuestSchema = z
  .object({
    name: z.string().min(1).max(150).trim(),
    phone,
    email: z.string().email().max(255).trim().nullable(),
    groupLabel: z.string().max(100).trim().nullable(),
    partySize: z.coerce.number().int().min(1).max(50),
    rsvpStatus: z.enum(RsvpStatusEnum.options),
    notes: z.string().max(2000).trim().nullable(),
  })
  .partial();

export const listGuestsQuery = z.object({
  groupLabel: z.string().trim().optional(),
  rsvpStatus: z.enum(RsvpStatusEnum.options).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

export type CreateGuestInput = z.infer<typeof createGuestSchema>;
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>;
export type ListGuestsQuery = z.infer<typeof listGuestsQuery>;
