import { z } from 'zod';

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(150).trim(),
  category: z.string().max(50).trim().default('classic'),
  design: z.record(z.string(), z.any()).default({}),
  thumbnail: z.string().max(2_000_000).nullable().optional(), // URL or data-URL
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
