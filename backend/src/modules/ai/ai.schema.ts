import { z } from 'zod';
import { EventTypeEnum } from '../../lib/enums.js';

export const generateTextSchema = z.object({
  eventType: z.enum(EventTypeEnum.options).optional(),
  tone: z.enum(['Luxury', 'Simple', 'Traditional', 'Modern']).default('Simple'),
  coupleNames: z.string().optional(),
  eventDate: z.string().optional(),
  venue: z.string().optional(),
  details: z.string().optional(),
});

export const improveTextSchema = z.object({
  text: z.string().min(1, 'Text is required'),
});

export const suggestTemplateSchema = z.object({
  eventType: z.enum(EventTypeEnum.options).optional(),
  tone: z.enum(['Luxury', 'Simple', 'Traditional', 'Modern']).default('Simple'),
});

export type GenerateTextInput = z.infer<typeof generateTextSchema>;
export type ImproveTextInput = z.infer<typeof improveTextSchema>;
export type SuggestTemplateInput = z.infer<typeof suggestTemplateSchema>;
