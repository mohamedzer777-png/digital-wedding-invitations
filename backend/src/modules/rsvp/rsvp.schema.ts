import { z } from 'zod';

// Only real responses are allowed here (not PENDING).
export const respondSchema = z.object({
  status: z.enum(['GOING', 'NOT_GOING', 'MAYBE']),
  partySize: z.coerce.number().int().min(1).max(50).optional(),
});

export type RespondInput = z.infer<typeof respondSchema>;
