import { ConfigService } from '@nestjs/config';
import { StorageDriver } from '@otwld/ts-storage';

import type { StorageModuleOptions } from './storage-module-options';

const DEFAULT_ACCESS_KEY_KEY = 'MINIO_ACCESS_KEY';
const DEFAULT_BUCKET_KEY = 'MINIO_BUCKET';
const DEFAULT_ENDPOINT_KEY = 'MINIO_ENDPOINT';
const DEFAULT_PORT_KEY = 'MINIO_PORT';
const DEFAULT_REGION = 'us-east-1';
const DEFAULT_REGION_KEY = 'MINIO_REGION';
const DEFAULT_SECRET_KEY_KEY = 'MINIO_SECRET_KEY';
const DEFAULT_USE_SSL_KEY = 'MINIO_USE_SSL';

export interface MinioStorageConfigKeyOptions {
  accessKeyKey?: string;
  bucketKey?: string;
  defaultRegion?: string;
  endpointKey?: string;
  portKey?: string;
  regionKey?: string;
  secretKeyKey?: string;
  signedUrlMaxTtl?: number;
  useSslKey?: string;
}

function readRequiredConfig(configService: ConfigService, key: string): string {
  const value = configService.get<string>(key)?.trim();

  if (!value) {
    throw new Error(`Missing required configuration value ${key}`);
  }

  return value;
}

function readOptionalConfig(
  configService: ConfigService,
  key: string,
): string | undefined {
  const value = configService.get<string>(key)?.trim();

  return value ? value : undefined;
}

function parsePort(value: string | undefined, key: string): number | undefined {
  if (value == null) {
    return undefined;
  }

  const parsedValue = Number(value);
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`Invalid ${key} value: "${value}"`);
  }

  return parsedValue;
}

function parseBoolean(value: string, key: string): boolean {
  if (value === 'true' || value === '1') {
    return true;
  }

  if (value === 'false' || value === '0') {
    return false;
  }

  throw new Error(`Invalid ${key} value: "${value}"`);
}

function buildEndpointUrl(
  endpoint: string,
  port: number | undefined,
  useSsl: boolean,
  key: string,
): string {
  if (endpoint.includes('://')) {
    throw new Error(
      `${key} must contain only the host name, not a full URL: "${endpoint}"`,
    );
  }

  return `${useSsl ? 'https' : 'http'}://${endpoint}${port ? `:${port}` : ''}`;
}

export function getStorageS3OptionsFromMinioConfig(
  configService: ConfigService,
  options: MinioStorageConfigKeyOptions = {},
): StorageModuleOptions {
  const accessKeyKey = options.accessKeyKey ?? DEFAULT_ACCESS_KEY_KEY;
  const bucketKey = options.bucketKey ?? DEFAULT_BUCKET_KEY;
  const endpointKey = options.endpointKey ?? DEFAULT_ENDPOINT_KEY;
  const portKey = options.portKey ?? DEFAULT_PORT_KEY;
  const regionKey = options.regionKey ?? DEFAULT_REGION_KEY;
  const secretKeyKey = options.secretKeyKey ?? DEFAULT_SECRET_KEY_KEY;
  const useSslKey = options.useSslKey ?? DEFAULT_USE_SSL_KEY;

  const useSsl = parseBoolean(
    readRequiredConfig(configService, useSslKey),
    useSslKey,
  );
  const port = parsePort(readOptionalConfig(configService, portKey), portKey);
  const endpoint = buildEndpointUrl(
    readRequiredConfig(configService, endpointKey),
    port,
    useSsl,
    endpointKey,
  );

  return {
    driver: StorageDriver.S3,
    s3: {
      accessKeyId: readRequiredConfig(configService, accessKeyKey),
      bucket: readRequiredConfig(configService, bucketKey),
      endpoint,
      forcePathStyle: true,
      region:
        readOptionalConfig(configService, regionKey) ??
        options.defaultRegion ??
        DEFAULT_REGION,
      secretAccessKey: readRequiredConfig(configService, secretKeyKey),
      signedUrlMaxTtl: options.signedUrlMaxTtl,
    },
  };
}
