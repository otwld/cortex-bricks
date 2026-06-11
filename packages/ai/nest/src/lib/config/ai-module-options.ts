import { CanActivate, Type } from '@nestjs/common';
import type { NestFeatureModuleClassAsyncOptions } from '@otwld/nest-sdk';
import { z } from 'zod';
import {
  AiModelCapability,
  AiQuotaPolicy,
  AiRequestLimits,
  aiQuotaPolicySchema,
  aiRequestLimitsSchema,
  normalizeAiRequestLimits,
} from '@otwld/ts-ai';
import { AiException } from '../exceptions/ai.exception';
import { MODULE_OPTIONS_TOKEN } from './ai.module-definition';

/**
 * Injection token for normalized AI module options.
 */
export const AI_MODULE_OPTIONS = MODULE_OPTIONS_TOKEN;

/**
 * Injection token for normalized AI endpoint options.
 */
export const AI_ENDPOINT_OPTIONS = Symbol('AI_ENDPOINT_OPTIONS');

/**
 * OpenAI-compatible provider configuration.
 */
export interface OpenAiProviderOptions {
  apiKey?: string;
  baseURL?: string;
}

/**
 * Provider configuration map supported by the Nest AI module.
 */
export interface AiProviderOptions {
  openai?: OpenAiProviderOptions;
}

/**
 * Model alias configuration for a provider-backed model.
 */
export interface AiModelOptions {
  providerModel: string;
  capabilities?: AiModelCapability[];
  label?: string;
}

/**
 * Model alias configuration after validation and capability inference.
 */
export interface NormalizedAiModelOptions {
  providerModel: string;
  capabilities: AiModelCapability[];
  label?: string;
}

/**
 * Compact or expanded model entry accepted in `AiModuleOptions.models`.
 */
export type AiModelEntry = string | AiModelOptions;

/**
 * Represents the quota storage backend kind.
 */
export type AiQuotaStorageKind = 'mongoose';

/**
 * Represents a resolved quota user.
 */
export interface AiQuotaUserResolverResult {
  id: string;
  roles?: string[];
}

/**
 * Resolves the quota user from a request context.
 */
export type AiQuotaUserResolver = (context: unknown) => AiQuotaUserResolverResult | Promise<AiQuotaUserResolverResult>;

/**
 * Describes how quota subjects are read from requests.
 */
export interface AiQuotaUserOptions {
  idPath?: string;
  rolesPath?: string;
  resolve?: AiQuotaUserResolver;
}

/**
 * Describes endpoint quota policy and subject resolution.
 */
export type AiQuotaOptions = AiQuotaPolicy & {
  user?: AiQuotaUserOptions;
};

/**
 * AI endpoint controller, guard, validation, and quota configuration.
 */
export interface AiEndpointOptions {
  controller?: boolean;
  prefix?: string;
  guards?: Type<CanActivate>[];
  limits?: Partial<AiRequestLimits>;
  quota?: AiQuotaOptions;
}

/**
 * Root configuration accepted by the Nest AI module.
 */
export interface AiModuleOptions {
  providers: AiProviderOptions;
  models: Record<string, AiModelEntry>;
  endpoints?: AiEndpointOptions;
}

/**
 * Endpoint options after defaults and request limits have been applied.
 */
export interface NormalizedAiEndpointOptions {
  controller: boolean;
  prefix: string;
  guards: Type<CanActivate>[];
  limits: AiRequestLimits;
  quota: AiQuotaOptions;
}

/**
 * Root AI module options after validation and model normalization.
 */
export type NormalizedAiModuleOptions = Omit<AiModuleOptions, 'endpoints' | 'models'> & {
  endpoints: NormalizedAiEndpointOptions;
  models: Record<string, NormalizedAiModelOptions>;
};

export type { ASYNC_OPTIONS_TYPE as AiModuleAsyncOptions, OPTIONS_TYPE as AiModuleSyncOptions } from './ai.module-definition';

/**
 * Factory contract for classes that produce AI module options.
 */
export interface AiModuleOptionsFactory {
  createAiOptions(): Promise<AiModuleOptions> | AiModuleOptions;
}

/**
 * Manual async configuration shape accepted by `AiModule.forRootAsync`.
 */
export interface ManualAiModuleAsyncOptions
  extends NestFeatureModuleClassAsyncOptions<AiModuleOptions, AiModuleOptionsFactory> {
  endpoints?: AiEndpointOptions;
}

const providerModelSchema = z.string().regex(/^[a-z][a-z0-9-]*:.+$/, 'model references must use provider:model format');
const modelCapabilitySchema = z.enum(['chat', 'completion', 'object', 'tools']);
const modelEntrySchema = z.union([
  providerModelSchema,
  z.object({
    providerModel: providerModelSchema,
    capabilities: z.array(modelCapabilitySchema).min(1).optional(),
    label: z.string().min(1).optional(),
  }),
]);

const quotaUserOptionsSchema = z.object({
  idPath: z.string().min(1).optional(),
  rolesPath: z.string().min(1).optional(),
  resolve: z.custom<AiQuotaUserResolver>((value) => typeof value === 'function', 'quota user resolver must be a function').optional(),
});

const quotaOptionsSchema = aiQuotaPolicySchema
  .extend({
    user: quotaUserOptionsSchema.optional(),
  })
  .default({ enabled: false, rules: [] })
  .superRefine((quota, context) => {
    if (quota.enabled && !quota.storage) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'quota storage is required when quota is enabled',
        path: ['storage'],
      });
    }
  });

const endpointOptionsSchema = z
  .object({
    controller: z.boolean().default(true),
    prefix: z.string().min(1).default('ai'),
    guards: z.array(z.custom<Type<CanActivate>>((value) => typeof value === 'function', 'guards must be guard classes')).default([]),
    limits: aiRequestLimitsSchema.partial().default({}),
    quota: quotaOptionsSchema.optional(),
  })
  .default({});

const optionsSchema = z.object({
  providers: z
    .object({
      openai: z
        .object({
          apiKey: z.string().min(1).optional(),
          baseURL: z.string().url().optional(),
        })
        .optional(),
    })
    .default({}),
  models: z.record(modelEntrySchema).refine((models) => Object.keys(models).length > 0, 'at least one model alias is required'),
  endpoints: endpointOptionsSchema.optional(),
});

/**
 * Validates and defaults endpoint-level AI module options.
 *
 * @param options - Partial endpoint options from module configuration.
 *
 * @returns Normalized endpoint options.
 *
 * @throws `AiException` when endpoint configuration is invalid.
 */
export function normalizeAiEndpointOptions(options: AiEndpointOptions = {}): NormalizedAiEndpointOptions {
  const parsed = endpointOptionsSchema.safeParse(options);
  if (parsed.success) {
    return {
      controller: parsed.data.controller ?? true,
      prefix: parsed.data.prefix ?? 'ai',
      guards: parsed.data.guards ?? [],
      limits: normalizeAiRequestLimits(parsed.data.limits),
      quota: (parsed.data.quota ?? { enabled: false, rules: [] }) as AiQuotaOptions,
    };
  }

  const details = parsed.error.issues.map((issue) => `${issue.path.join('.') || 'endpoints'}: ${issue.message}`).join('; ');
  throw AiException.misconfigured(`AI endpoint configuration is invalid: ${details}`, parsed.error);
}

function inferModelCapabilities(alias: string): AiModelCapability[] {
  const normalized = alias.toLowerCase();
  if (normalized.includes('structured') || normalized.includes('object')) return ['object'];
  if (normalized.includes('fast') || normalized.includes('completion')) return ['completion'];
  if (normalized.includes('chat')) return ['chat'];

  return ['chat', 'completion', 'object'];
}

function normalizeModel(alias: string, entry: AiModelEntry): NormalizedAiModelOptions {
  if (typeof entry === 'string') {
    return {
      providerModel: entry,
      capabilities: inferModelCapabilities(alias),
    };
  }

  return {
    providerModel: entry.providerModel,
    capabilities: entry.capabilities ?? inferModelCapabilities(alias),
    ...(entry.label ? { label: entry.label } : {}),
  };
}

/**
 * Validates AI module options and resolves model aliases to normalized entries.
 *
 * @param options - Raw module options provided by the application.
 *
 * @returns Normalized module options ready for Nest providers.
 *
 * @throws `AiException` when provider, model, endpoint, or quota options are invalid.
 */
export function validateAiModuleOptions(options: AiModuleOptions): NormalizedAiModuleOptions {
  const parsed = optionsSchema.safeParse(options);
  if (parsed.success) {
    return {
      providers: parsed.data.providers,
      models: Object.fromEntries(Object.entries(parsed.data.models).map(([alias, entry]) => [alias, normalizeModel(alias, entry as AiModelEntry)])),
      endpoints: normalizeAiEndpointOptions(parsed.data.endpoints),
    };
  }

  const details = parsed.error.issues.map((issue) => `${issue.path.join('.') || 'options'}: ${issue.message}`).join('; ');
  throw AiException.misconfigured(`AI module configuration is invalid: ${details}`, parsed.error);
}
