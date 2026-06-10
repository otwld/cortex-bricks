import { z } from 'zod';

/**
 * Runtime environment schema for the backend app.
 */
export const envSchema = z.object({
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().url(),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  GITHUB_CALLBACK_URL: z.string().url(),
  ADMIN_EMAILS: z.string().optional(),
  FRONTEND_URL: z.string().url(),
  MAIL_TRANSPORT: z.enum(['postal', 'smtp', 'preview']).optional().default('postal'),
  POSTAL_SERVER_URL: z.string().url().optional(),
  POSTAL_API_KEY: z.string().min(1).optional(),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_SECURE: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((value) => value === 'true'),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASSWORD: z.string().min(1).optional(),
  MAILPIT_HOST: z.string().min(1).optional(),
  MAILPIT_SMTP_PORT: z.coerce.number().int().positive().optional().default(1025),
  MAIL_FROM: z.string().min(1),
  MINIO_ENDPOINT: z.string().min(1),
  MINIO_PORT: z.coerce.number().int().positive(),
  MINIO_USE_SSL: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((value) => value === 'true'),
  MINIO_BUCKET: z.string().min(1),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1).optional(),
  AI_CHAT_MODEL: z.string().min(1).optional().default('gpt-5.4'),
  AI_FAST_MODEL: z.string().min(1).optional().default('gpt-5.4-mini'),
  AI_STRUCTURED_MODEL: z.string().min(1).optional().default('gpt-5.4'),
  DEV_AUTH_ENABLED: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  DEV_AUTH_EMAIL: z.string().email().optional(),
  DEV_AUTH_PASSWORD: z.string().min(1).optional(),
}).superRefine((env, ctx) => {
  if (env.MAIL_TRANSPORT === 'postal') {
    if (!env.POSTAL_SERVER_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['POSTAL_SERVER_URL'],
        message: 'Required when MAIL_TRANSPORT is postal',
      });
    }

    if (!env.POSTAL_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['POSTAL_API_KEY'],
        message: 'Required when MAIL_TRANSPORT is postal',
      });
    }
  }

  if (env.MAIL_TRANSPORT === 'smtp' && !env.SMTP_HOST) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['SMTP_HOST'],
      message: 'Required when MAIL_TRANSPORT is smtp',
    });
  }

  if (!env.DEV_AUTH_ENABLED) return;

  if (!env.DEV_AUTH_EMAIL) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['DEV_AUTH_EMAIL'],
      message: 'Required when DEV_AUTH_ENABLED is true',
    });
  }

  if (!env.DEV_AUTH_PASSWORD) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['DEV_AUTH_PASSWORD'],
      message: 'Required when DEV_AUTH_ENABLED is true',
    });
  }
});

/**
 * Backend environment after schema validation and defaulting.
 */
export type AppEnv = z.infer<typeof envSchema>;

/**
 * Validates raw environment values before the backend configuration factory
 * reads from `process.env`.
 *
 * @throws When required variables are missing or cross-field transport settings
 * are inconsistent.
 */
export function validate(config: Record<string, unknown>): AppEnv {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Environment validation failed:\n${JSON.stringify(result.error.flatten().fieldErrors, null, 2)}`);
  }
  return result.data;
}
