import { Readable } from 'node:stream';
import { mkdtempSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { StorageDriver } from '@otwld/ts-storage';
import { describeMultipartStorageDriver, describeStorageDriver } from './driver-contract.spec-helper';
import { FilesystemStorageDriver } from './filesystem.driver';
import { verifyFilesystemSignedToken } from './filesystem-signed-url';

const signedUrlSecret = 'a'.repeat(32);

describe(FilesystemStorageDriver.name, () => {
  let rootPath: string;
  let driver: FilesystemStorageDriver;

  beforeEach(async () => {
    rootPath = await mkdtemp(join(tmpdir(), 'storage-driver-'));
    driver = new FilesystemStorageDriver({
      driver: StorageDriver.Filesystem,
      filesystem: {
        rootPath,
        signedUrlSecret,
        signedUrlTtl: 3600,
        publicPath: '/storage/files',
      },
    });
  });

  afterEach(async () => {
    await rm(rootPath, { recursive: true, force: true });
  });

  it('assembles multipart chunks atomically into the target key', async () => {
    const uploadId = await driver.createMultipartUpload('docs/a.txt', {
      filename: 'a.txt',
      mimetype: 'text/plain',
      size: 11,
    });
    const first = await driver.uploadPart(uploadId, 'docs/a.txt', 1, Buffer.from('hello '));
    const second = await driver.uploadPart(uploadId, 'docs/a.txt', 2, Buffer.from('world'));

    await driver.completeMultipartUpload(uploadId, 'docs/a.txt', [
      { partNumber: 1, etag: first },
      { partNumber: 2, etag: second },
    ]);

    await expect(readFile(join(rootPath, 'docs/a.txt'), 'utf8')).resolves.toBe('hello world');
    await expect(driver.exists('docs/a.txt')).resolves.toBe(true);
  });

  it('writes regular streams and generates redeemable signed URLs', async () => {
    await driver.put('plain/file.txt', Readable.from(['payload']), {
      filename: 'file.txt',
      mimetype: 'text/plain',
      size: 7,
    });

    const signedUrl = await driver.getSignedUrl('plain/file.txt', 60);
    const token = signedUrl.split('/').pop() ?? '';

    await expect(readFile(join(rootPath, 'plain/file.txt'), 'utf8')).resolves.toBe('payload');
    expect(verifyFilesystemSignedToken(token, signedUrlSecret).key).toBe('plain/file.txt');
  });

  it('rejects traversal keys before touching the filesystem', async () => {
    await expect(driver.getReadStream('../secret.txt')).rejects.toThrow(/Invalid storage key/);
  });
});

describe('FilesystemStorageDriver - contract', () => {
  const factory = async () =>
    new FilesystemStorageDriver({
      driver: StorageDriver.Filesystem,
      filesystem: {
        rootPath: mkdtempSync(join(tmpdir(), 'sto-')),
        signedUrlSecret,
        signedUrlTtl: 60,
        publicPath: '/storage/files',
      },
    });

  describeStorageDriver(() => factory());
  describeMultipartStorageDriver(() => factory());
});
