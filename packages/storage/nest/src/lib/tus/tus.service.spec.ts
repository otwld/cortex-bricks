import { Readable } from 'node:stream';
import { StorageDriver } from '@otwld/ts-storage';
import { MultipartStorageDriver } from '../drivers/multipart-storage-driver';
import { HookRunnerService } from '../hooks/hook-runner.service';
import { TusService } from './tus.service';
import { createMemoryModel } from '../testing/memory-model';
import { StorageExceptionCode } from '../exceptions/storage.exception';
import { UploadState } from '../schemas/upload-state.schema';
import { StorageFileRecord } from '../schemas/storage-file.schema';

class MemoryMultipartDriver extends MultipartStorageDriver {
  readonly uploads = new Map<string, Buffer[]>();

  async put(): Promise<void> {
    return undefined;
  }

  async delete(): Promise<void> {
    return undefined;
  }

  async getSignedUrl(key: string): Promise<string> {
    return `signed:${key}`;
  }

  async getReadStream(key: string): Promise<Readable> {
    const chunks = this.uploads.get(key) ?? [];
    return Readable.from([Buffer.concat(chunks)]);
  }

  async exists(): Promise<boolean> {
    return true;
  }

  async createMultipartUpload(key: string): Promise<string> {
    this.uploads.set(key, []);
    return key;
  }

  async uploadPart(uploadId: string, _key: string, _partNumber: number, chunk: Buffer): Promise<string> {
    this.uploads.get(uploadId)?.push(chunk);
    return `etag-${chunk.length}`;
  }

  async completeMultipartUpload(): Promise<void> {
    return undefined;
  }

  async abortMultipartUpload(uploadId: string): Promise<void> {
    this.uploads.delete(uploadId);
  }
}

describe(TusService.name, () => {
  function createService() {
    return new TusService(
      new MemoryMultipartDriver(),
      createMemoryModel<UploadState>(),
      createMemoryModel<StorageFileRecord>(),
      new HookRunnerService([]),
      {
        path: '/storage/tus',
        maxSize: 100,
        uploadStateTtl: 3600,
        cleanupIntervalMs: 1000,
      },
      {
        driver: StorageDriver.Filesystem,
        filesystem: {
          rootPath: '/tmp',
          signedUrlSecret: 'a'.repeat(32),
          signedUrlTtl: 3600,
          publicPath: '/storage/files',
        },
      },
    );
  }

  it('enforces Upload-Offset before appending chunks', async () => {
    const service = createService();
    const created = await service.createUpload({
      filename: 'a.txt',
      mimetype: 'text/plain',
      size: 4,
    });
    await service.appendChunk(created.uploadId, 0, Buffer.from('ab'));

    await expect(service.appendChunk(created.uploadId, 0, Buffer.from('cd'))).rejects.toMatchObject({
      code: StorageExceptionCode.UPLOAD_OFFSET_MISMATCH,
    });
  });

  it('rejects checksum mismatches using the TUS checksum extension', async () => {
    const service = createService();
    const created = await service.createUpload({
      filename: 'a.txt',
      mimetype: 'text/plain',
      size: 4,
    });

    await expect(service.appendChunk(created.uploadId, 0, Buffer.from('ab'), 'sha256 wrong')).rejects.toMatchObject({
      code: StorageExceptionCode.CHECKSUM_MISMATCH,
    });
  });

  it('rejects chunks that exceed the declared upload length', async () => {
    const service = createService();
    const created = await service.createUpload({
      filename: 'a.txt',
      mimetype: 'text/plain',
      size: 5,
    });
    await service.appendChunk(created.uploadId, 0, Buffer.from('abcd'));

    await expect(service.appendChunk(created.uploadId, 4, Buffer.from('ef'))).rejects.toMatchObject({
      code: StorageExceptionCode.MISCONFIGURED,
      response: expect.objectContaining({ message: expect.stringContaining('exceeds') }),
    });
  });

  it('rejects client supplied TUS storage keys outside the uploads prefix', async () => {
    const service = createService();

    await expect(
      service.createUpload({
        filename: 'avatar.png',
        mimetype: 'image/png',
        size: 1,
        metadata: { key: '../private/avatar.png' },
      }),
    ).rejects.toMatchObject({
      code: StorageExceptionCode.INVALID_STORAGE_KEY,
    });
  });

  it('returns the stored file metadata when the final chunk completes an upload', async () => {
    const service = createService();
    const created = await service.createUpload({
      filename: 'a.txt',
      mimetype: 'text/plain',
      size: 4,
      metadata: { owner: 'dashboard' },
    });

    const result = await service.appendChunk(created.uploadId, 0, Buffer.from('test'));

    expect(result.offset).toBe(4);
    expect(result.file).toEqual(
      expect.objectContaining({
        key: created.key,
        filename: 'a.txt',
        mimetype: 'text/plain',
        size: 4,
        driver: StorageDriver.Filesystem,
        metadata: { owner: 'dashboard', filename: 'a.txt', mimetype: 'text/plain' },
      }),
    );
  });
});
