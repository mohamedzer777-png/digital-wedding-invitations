import { z } from 'zod';

export const configureRemindersSchema = z.object({
  reminders: z
    .array(
      z.object({
        offsetHours: z.coerce.number().int().min(1).max(8760), // 1h … 1 year before event
        enabled: z.boolean().default(true),
      }),
    )
    .max(10),
});

export type ConfigureRemindersInput = z.infer<typeof configureRemindersSchema>;
