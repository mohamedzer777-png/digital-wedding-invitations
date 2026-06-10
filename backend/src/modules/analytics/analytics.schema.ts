import { z } from 'zod';

export const analyticsTimelineQuery = z.object({
  days: z.coerce.number().int().min(7).max(90).default(14),
});

export type AnalyticsTimelineQuery = z.infer<typeof analyticsTimelineQuery>;
