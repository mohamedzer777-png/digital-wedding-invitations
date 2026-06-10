import { z } from 'zod';
import { EventStatusEnum, EventTypeEnum } from '../../lib/enums.js';

export const createEventSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  type: z.enum(EventTypeEnum.options).default('WEDDING'),
  status: z.enum(EventStatusEnum.options).optional(),
  description: z.string().max(5000).trim().optional(),
  eventDate: z.coerce.date().optional(),
  venue: z.string().max(200).trim().optional(),
  location: z.string().max(500).trim().optional(),
  timezone: z.string().max(50).optional(),
});

// All fields optional on update.
export const updateEventSchema = createEventSchema.partial();

export const listEventsQuery = z.object({
  status: z.enum(EventStatusEnum.options).optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
