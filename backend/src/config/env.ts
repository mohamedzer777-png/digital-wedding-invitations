import 'dotenv/config';
import { z } from 'zod';

const DEFAULT_DEV_SECRETS = ['change-me-access-secret', 'change-me-refresh-secret'];

/**
 * Validated, typed environment configuration.
 * The process refuses to boot if required variables are missing/invalid, and
 * enforces stricter rules in production (no weak/default secrets, etc).
 */
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),

    APP_URL: z.string().url().default('http://localhost:3000'),
    CORS_ORIGINS: z
      .string()
      .default('http://localhost:3000')
      .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),

    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    REDIS_URL: z.string().default('redis://localhost:6379'),

    JWT_ACCESS_SECRET: z.string().min(8, 'JWT_ACCESS_SECRET is too short'),
    JWT_REFRESH_SECRET: z.string().min(8, 'JWT_REFRESH_SECRET is too short'),
    JWT_ACCESS_TTL: z.string().default('15m'),
    JWT_REFRESH_TTL: z.string().default('7d'),

    OPENAI_API_KEY: z.string().optional().default(''),
    OPENAI_MODEL: z.string().default('gpt-4o-mini'),

    WHATSAPP_PROVIDER: z.enum(['mock', 'cloud']).default('mock'),
    WHATSAPP_PHONE_NUMBER_ID: z.string().optional().default(''),
    WHATSAPP_ACCESS_TOKEN: z.string().optional().default(''),
    WHATSAPP_VERIFY_TOKEN: z.string().default('inviteflow-verify'),
    WHATSAPP_APP_SECRET: z.string().optional().default(''),
  })
  // ── Production hardening — fail fast on insecure config ──────────────────
  .superRefine((val, ctx) => {
    if (val.NODE_ENV !== 'production') return;

    const isWeak = (s: string) =>
      s.length < 32 || DEFAULT_DEV_SECRETS.includes(s) || /change[-_ ]?me/i.test(s);

    if (isWeak(val.JWT_ACCESS_SECRET))
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_ACCESS_SECRET'],
        message: 'In production JWT_ACCESS_SECRET must be a strong, non-default value (≥32 chars)',
      });
    if (isWeak(val.JWT_REFRESH_SECRET))
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_REFRESH_SECRET'],
        message: 'In production JWT_REFRESH_SECRET must be a strong, non-default value (≥32 chars)',
      });
    if (val.JWT_ACCESS_SECRET === val.JWT_REFRESH_SECRET)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_REFRESH_SECRET'],
        message: 'JWT access and refresh secrets must be different',
      });
    if (val.WHATSAPP_PROVIDER === 'cloud' && (!val.WHATSAPP_ACCESS_TOKEN || !val.WHATSAPP_PHONE_NUMBER_ID))
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['WHATSAPP_ACCESS_TOKEN'],
        message: 'WHATSAPP_PROVIDER=cloud requires WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID',
      });
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment configuration:');
  // eslint-disable-next-line no-console
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';

// Soft, non-fatal warnings for likely production misconfigurations.
if (isProd) {
  const localhostOrigins = env.CORS_ORIGINS.filter((o) => o.includes('localhost'));
  if (localhostOrigins.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(`⚠️  CORS_ORIGINS still contains localhost in production: ${localhostOrigins.join(', ')}`);
  }
  if (env.APP_URL.includes('localhost')) {
    // eslint-disable-next-line no-console
    console.warn('⚠️  APP_URL is still localhost in production — RSVP/invitation links will be wrong.');
  }
}
