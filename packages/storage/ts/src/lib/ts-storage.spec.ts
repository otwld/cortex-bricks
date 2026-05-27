import { CompleteUploadDto, CreateUploadDto, SignedUrlRequestDto } from './dto';
import { StorageDriver, UploadStatus } from './enums';
import { Part, StorageFile, UploadMeta } from './interfaces';

describe('ts-storage contracts', () => {
  it('exports stable enum values shared by Nest and Angular packages', () => {
    expect(StorageDriver).toEqual({ S3: 's3', Filesystem: 'filesystem' });
    expect(UploadStatus).toEqual({
      Pending: 'pending',
      Active: 'active',
      Paused: 'paused',
      Completed: 'completed',
      Failed: 'failed',
    });
  });

  it('keeps upload DTOs assignable to the shared metadata and multipart contracts', () => {
    const create: CreateUploadDto = {
      filename: 'report.pdf',
      mimetype: 'application/pdf',
      size: 1024,
      metadata: { ownerId: 'user-1' },
    };
    const part: Part = { partNumber: 1, etag: 'abc123' };
    const complete: CompleteUploadDto = { uploadId: 'upload-1', parts: [part] };
    const signedUrl: SignedUrlRequestDto = { key: 'reports/report.pdf', expiresIn: 600 };

    expect(create satisfies UploadMeta).toEqual(expect.objectContaining({ filename: 'report.pdf' }));
    expect(complete.parts).toEqual([part]);
    expect(signedUrl).toEqual({ key: 'reports/report.pdf', expiresIn: 600 });
  });

  it('describes stored files with soft-delete and checksum fields', () => {
    const now = new Date('2026-05-06T00:00:00.000Z');
    const file: StorageFile = {
      id: 'file-1',
      key: 'avatars/a.png',
      filename: 'a.png',
      mimetype: 'image/png',
      size: 64,
      driver: StorageDriver.Filesystem,
      checksum: 'sha256',
      ownerId: 'user-1',
      deletedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    expect(file.driver).toBe(StorageDriver.Filesystem);
    expect(file.deletedAt).toBe(now);
    expect(file.checksum).toBe('sha256');
  });
});
