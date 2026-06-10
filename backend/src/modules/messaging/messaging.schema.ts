import { z } from 'zod';
import { MessageStatusEnum, MessageTypeEnum } from '../../lib/enums.js';

export const sendSchema = z.object({
  guestIds: z.array(z.string().max(30)).optional(), // omit = send to all guests
  type: z.enum(MessageTypeEnum.options).default('INVITATION'),
  body: z.string().max(4096).trim().optional(), // optional override of the message text
});

export const scheduleSchema = sendSchema.extend({
  scheduledAt: z.coerce
    .date()
    .refine((d) => d.getTime() > Date.now(), 'scheduledAt must be in the future'),
});

export const listMessagesQuery = z.object({
  status: z.enum(MessageStatusEnum.options).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

export type SendInput = z.infer<typeof sendSchema>;
export type ScheduleInput = z.infer<typeof scheduleSchema>;
export type ListMessagesQuery = z.infer<typeof listMessagesQuery>;
