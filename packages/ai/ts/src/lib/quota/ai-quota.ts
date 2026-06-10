import { z } from 'zod';

/** Time units accepted by AI quota windows. */
export const aiQuotaWindowUnitSchema = z.enum(['minute', 'hour', 'day', 'week']);

/** Time unit accepted by an AI quota window. */
export type AiQuotaWindowUnit = z.infer<typeof aiQuotaWindowUnitSchema>;

/** Fixed quota window definition. */
export const aiQuotaWindowSchema = z.object({
  unit: aiQuotaWindowUnitSchema,
  size: z.number().int().positive(),
});

/** Fixed quota window definition. */
export type AiQuotaWindow = z.infer<typeof aiQuotaWindowSchema>;

/** Token limit for one quota window. */
export const aiQuotaLimitSchema = z.object({
  window: aiQuotaWindowSchema,
  maxTokens: z.number().int().positive(),
});

/** Token limit for one quota window. */
export type AiQuotaLimit = z.infer<typeof aiQuotaLimitSchema>;

/** Subject whose AI usage is tracked. */
export const aiQuotaSubjectSchema = z.object({
  type: z.literal('user'),
  id: z.string().min(1),
  roles: z.array(z.string().min(1)).default([]),
});

/** Subject whose AI usage is tracked. */
export type AiQuotaSubject = z.infer<typeof aiQuotaSubjectSchema>;

/** Rule that grants quota limits to users or roles. */
export const aiQuotaRuleSchema = z.object({
  roles: z.array(z.string().min(1)).optional(),
  userIds: z.array(z.string().min(1)).optional(),
  limits: z.array(aiQuotaLimitSchema).min(1),
  maxPromptTokens: z.number().int().positive().optional(),
});

/** Rule that grants quota limits to users or roles. */
export type AiQuotaRule = z.infer<typeof aiQuotaRuleSchema>;

/** Quota policy configured for AI endpoints. */
export const aiQuotaPolicySchema = z.object({
  enabled: z.boolean().default(false),
  storage: z.enum(['mongoose']).optional(),
  defaultLimits: z.array(aiQuotaLimitSchema).optional(),
  rules: z.array(aiQuotaRuleSchema).default([]),
  maxPromptTokens: z.number().int().positive().optional(),
});

/** Quota policy configured for AI endpoints. */
export type AiQuotaPolicy = z.infer<typeof aiQuotaPolicySchema>;

/** Current usage for one quota window. */
export const aiQuotaUsageBucketSchema = z.object({
  window: aiQuotaWindowSchema,
  limitTokens: z.number().int().nonnegative(),
  usedTokens: z.number().int().nonnegative(),
  reservedTokens: z.number().int().nonnegative().default(0),
  remainingTokens: z.number().int().nonnegative(),
  resetAt: z.string().datetime(),
  exceeded: z.boolean(),
});

/** Current usage for one quota window. */
export type AiQuotaUsageBucket = z.infer<typeof aiQuotaUsageBucketSchema>;

/** Current effective usage snapshot for an AI quota subject. */
export const aiQuotaUsageSnapshotSchema = z.object({
  subject: aiQuotaSubjectSchema,
  maxPromptTokens: z.number().int().positive().optional(),
  buckets: z.array(aiQuotaUsageBucketSchema),
});

/** Current effective usage snapshot for an AI quota subject. */
export type AiQuotaUsageSnapshot = z.infer<typeof aiQuotaUsageSnapshotSchema>;

/** Details returned when an AI quota is exceeded. */
export const aiQuotaExceededDetailsSchema = z.object({
  bucket: aiQuotaUsageBucketSchema,
  requestedTokens: z.number().int().positive(),
});

/** Details returned when an AI quota is exceeded. */
export type AiQuotaExceededDetails = z.infer<typeof aiQuotaExceededDetailsSchema>;

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

/** Returns the start timestamp for the fixed window that contains the supplied date. */
export function getAiQuotaWindowStart(window: AiQuotaWindow, date: Date): Date {
  if (window.unit === 'minute') {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), Math.floor(date.getUTCMinutes() / window.size) * window.size));
  }

  if (window.unit === 'hour') {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), Math.floor(date.getUTCHours() / window.size) * window.size));
  }

  if (window.unit === 'day' && window.size === 1) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }

  if (window.unit === 'week' && window.size === 1) {
    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = start.getUTCDay() || 7;
    start.setUTCDate(start.getUTCDate() - day + 1);
    return start;
  }

  const duration = durationMs(window);
  return new Date(Math.floor(date.getTime() / duration) * duration);
}

/** Returns the reset timestamp for the fixed window that contains the supplied date. */
export function getAiQuotaWindowReset(window: AiQuotaWindow, date: Date): Date {
  return new Date(getAiQuotaWindowStart(window, date).getTime() + durationMs(window));
}

/** Creates a stable quota bucket key for a fixed window. */
export function createAiQuotaWindowKey(window: AiQuotaWindow, date: Date): string {
  return `${window.unit}:${window.size}:${getAiQuotaWindowStart(window, date).toISOString()}`;
}

function durationMs(window: AiQuotaWindow): number {
  if (window.unit === 'minute') return window.size * MINUTE_MS;
  if (window.unit === 'hour') return window.size * HOUR_MS;
  if (window.unit === 'day') return window.size * DAY_MS;
  return window.size * WEEK_MS;
}
