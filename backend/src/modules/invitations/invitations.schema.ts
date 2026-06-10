import { z } from 'zod';
import { InvitationStatusEnum } from '../../lib/enums.js';

// `design` is an arbitrary drag-and-drop document (blocks, positions, styles).
export const saveInvitationSchema = z.object({
  design: z.record(z.string(), z.any()).optional(),
  bodyText: z.string().max(5000).nullable().optional(),
  templateId: z.string().max(30).nullable().optional(),
  status: z.enum(InvitationStatusEnum.options).optional(),
});

export type SaveInvitationInput = z.infer<typeof saveInvitationSchema>;
