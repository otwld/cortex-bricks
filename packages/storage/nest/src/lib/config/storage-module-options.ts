import { ModuleMetadata, Type } from '@nestjs/common';
import { StorageDriver as StorageDriverKind } from '@otwld/ts-storage';
import { z } from 'zod';
import { StorageHook } from '../hooks/storage-hook';
import { MODULE_OPTIONS_TOKEN } from './storage.module-definition';
import { StorageException } from '../exceptions/storage.exception';

/**
 * Injection token that stores normalized Nest storage module options.
 */
export const STORAGE_MODULE_OPTIONS = MODULE_OPTIONS_TOKEN;

/** S3-compatible storage backend configuration. */
export interface S3StorageOptions {
  /** Bucket that stores object payloads. */
  bucket: string;
  /** AWS region or S3-compatible region name. */
  region: string;
  /** Optional custom endpoint for S3-compatible providers. */
  endpoint?: string;
  /** Whether to force path-style bucket addressing. */
  forcePathStyle?: boolean;
  /** Optional access key id for explicit credentials. */
  accessKeyId?: string;
  /** Optional secret access key for explicit credentials. */
  secretAccessKey?: string;
  /** Optional session token for temporary credentials. */
  sessionToken?: string;
  /** Hard cap on `getSignedUrl(expiresIn)` requests, in seconds. Default: 86400 (24h), max 604800 (7 days). */
  signedUrlMaxTtl?: number;
}

/** Local filesystem storage backend configuration. */
export interface FilesystemStorageOptions {
  /** Root directory that contains stored files. */
  rootPath: string;
  /** HMAC secret used to sign filesystem read URLs. */
  signedUrlSecret: string;
  /** Default filesystem signed URL TTL in seconds. */
  signedUrlTtl?: number;
  /** Public route prefix used for filesystem signed URLs. */
  publicPath?: string;
}

/** Optional logger configuration for storage components. */
export interface StorageLoggerOptions {
  /** Minimum Nest logger level expected by consumers. */
  level?: 'log' | 'debug' | 'verbose' | 'warn' | 'error';
}

/** Root configuration for the Nest storage module. */
export interface StorageModuleOptions {
  /** Selected storage backend. */
  driver: StorageDriverKind;
  /** S3 options required when `driver` is `s3`. */
  s3?: S3StorageOptions;
  /** Filesystem options required when `driver` is `filesystem`. */
  filesystem?: FilesystemStorageOptions;
  /** Hook classes instantiated by the module. */
  hooks?: Type<StorageHook>[];
  /** Optional logging preferences. */
  logger?: StorageLoggerOptions;
}

/** Storage options after schema validation and defaulting. */
export type NormalizedStorageModuleOptions = StorageModuleOptions & {
  s3?: S3StorageOptions & {
    signedUrlMaxTtl: number;
  };
  filesystem?: FilesystemStorageOptions & {
    signedUrlTtl: number;
    publicPath: string;
  };
};

export type { ASYNC_OPTIONS_TYPE as StorageModuleAsyncOptions, OPTIONS_TYPE as StorageModuleSyncOptions } from './storage.module-definition';

/** Factory interface for async storage module configuration. */
export interface StorageModuleOptionsFactory {
  /** Create storage options synchronously or asynchronously. */
  createStorageOptions(): Promise<StorageModuleOptions> | StorageModuleOptions;
}

/** Manual async configuration options accepted by `StorageModule.forRootAsync`. */
export interface ManualStorageModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /** Factory function used to create storage options. */
  useFactory?: (...args: never[]) => Promise<StorageModuleOptions> | StorageModuleOptions;
  /** Providers injected into `useFactory`. */
  inject?: unknown[];
  /** Class provider that implements `StorageModuleOptionsFactory`. */
  useClass?: Type<StorageModuleOptionsFactory>;
  /** Existing provider that implements `StorageModuleOptionsFactory`. */
  useExisting?: Type<StorageModuleOptionsFactory>;
  /** Register filesystem read routes for async filesystem configurations. Default: false. */
  exposeFilesystemController?: boolean;
}

const loggerSchema = z
  .object({
    level: z.enum(['log', 'debug', 'verbose', 'warn', 'error']).optional(),
  })
  .optional();

const optionsSchema = z
  .object({
    driver: z.nativeEnum(StorageDriverKind),
    s3: z
      .object({
        bucket: z.string().min(1),
        region: z.string().min(1),
        endpoint: z.string().url().optional(),
        forcePathStyle: z.boolean().optional(),
        accessKeyId: z.string().min(1).optional(),
        secretAccessKey: z.string().min(1).optional(),
        sessionToken: z.string().min(1).optional(),
        signedUrlMaxTtl: z.number().int().positive().max(604_800).default(86_400),
      })
      .optional(),
    filesystem: z
      .object({
        rootPath: z.string().min(1),
        signedUrlSecret: z.string().min(32, 'signedUrlSecret must be at least 32 characters'),
        signedUrlTtl: z.number().int().positive().default(3600),
        publicPath: z.string().min(1).default('/storage/files'),
      })
      .optional(),
    hooks: z.array(z.custom<Type<StorageHook>>((value) => typeof value === 'function')).default([]),
    logger: loggerSchema,
  })
  .superRefine((value, ctx) => {
    if (value.driver === StorageDriverKind.S3 && !value.s3) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['s3'], message: 's3 options are required for S3 driver' });
    }
    if (value.driver === StorageDriverKind.Filesystem && !value.filesystem) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['filesystem'],
        message: 'filesystem options are required for filesystem driver',
      });
    }
  });

/**
 * Validate and normalize storage module options.
 *
 * @param options - Raw options supplied to `StorageModule`.
 * @returns Parsed options with defaults applied.
 * @throws StorageException When the options are incomplete for the selected driver.
 */
export function validateStorageModuleOptions(options: StorageModuleOptions): NormalizedStorageModuleOptions {
  const parsed = optionsSchema.safeParse(options);
  if (parsed.success) return parsed.data as NormalizedStorageModuleOptions;

  const details = parsed.error.issues.map((issue) => `${issue.path.join('.') || 'options'}: ${issue.message}`).join('; ');
  throw StorageException.misconfigured(`Storage module configuration is invalid: ${details}`, parsed.error);
}
