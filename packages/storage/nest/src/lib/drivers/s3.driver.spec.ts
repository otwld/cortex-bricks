import type { Mock } from 'vitest';
import { Readable } from 'node:stream';
import { StorageDriver as StorageDriverKind } from '@otwld/ts-storage';
import {
  describeMultipartStorageDriver,
  describeStorageDriver,
} from './driver-contract.spec-helper';
import { StorageModuleOptions } from '../config/storage-module-options';
import { S3StorageDriver } from './s3.driver';

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://signed.example/object'),
}));

vi.mock('@aws-sdk/client-s3', async () => {
  const { createMockS3 } = await import('./s3.driver.in-memory-mock');
  const mockS3 = createMockS3();

  class GetObjectCommand {
    constructor(public input: unknown) {}
  }
  class PutObjectCommand {
    constructor(public input: unknown) {}
  }
  class DeleteObjectCommand {
    constructor(public input: unknown) {}
  }
  class HeadObjectCommand {
    constructor(public input: unknown) {}
  }
  class CreateMultipartUploadCommand {
    constructor(public input: unknown) {}
  }
  class UploadPartCommand {
    constructor(public input: unknown) {}
  }
  class CompleteMultipartUploadCommand {
    constructor(public input: unknown) {}
  }
  class AbortMultipartUploadCommand {
    constructor(public input: unknown) {}
  }
  return {
    S3Client: vi.fn(function S3Client() {
      return { send: mockS3.send };
    }),
    GetObjectCommand,
    PutObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
    CreateMultipartUploadCommand,
    UploadPartCommand,
    CompleteMultipartUploadCommand,
    AbortMultipartUploadCommand,
  };
});

describe('S3StorageDriver.getSignedUrl', () => {
  const baseOptions = {
    driver: StorageDriverKind.S3 as const,
    s3: { bucket: 'b', region: 'us-east-1', signedUrlMaxTtl: 3600 },
  } satisfies StorageModuleOptions;

  it('clamps requested TTL to configured max', async () => {
    const presigner = await import('@aws-sdk/s3-request-presigner');
    const driver = new S3StorageDriver(baseOptions);
    await driver.getSignedUrl('key', 999_999);
    const call = (presigner.getSignedUrl as Mock).mock.calls[0];
    expect(call[2].expiresIn).toBe(3600);
  });

  it('rejects metadata exceeding S3 limits', async () => {
    const driver = new S3StorageDriver({
      driver: StorageDriverKind.S3,
      s3: { bucket: 'b', region: 'us-east-1' },
    } satisfies StorageModuleOptions);
    const huge = { big: 'x'.repeat(3000) };
    await expect(
      driver.put('k', Readable.from(Buffer.alloc(1)), {
        filename: 'f',
        mimetype: 'text/plain',
        size: 1,
        metadata: huge,
      }),
    ).rejects.toThrow(/metadata/i);
  });
});

describe('S3StorageDriver - contract', () => {
  const factory = async () =>
    new S3StorageDriver({
      driver: StorageDriverKind.S3,
      s3: { bucket: 'b', region: 'us-east-1' },
    } satisfies StorageModuleOptions);

  describeStorageDriver(() => factory());
  describeMultipartStorageDriver(() => factory());
});
