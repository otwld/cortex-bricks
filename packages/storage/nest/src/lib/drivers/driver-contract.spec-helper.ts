import { Readable } from 'node:stream';
import { UploadMeta } from '@otwld/ts-storage';
import { MultipartStorageDriver } from './multipart-storage-driver';
import { StorageDriver } from './storage-driver';

const drainStream = async (stream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
};

const meta = (size: number): UploadMeta => ({ filename: 'f', mimetype: 'application/octet-stream', size });

export function describeStorageDriver(factory: () => Promise<StorageDriver>): void {
  let driver: StorageDriver;

  beforeAll(async () => {
    driver = await factory();
  });

  it('puts then reads back the same bytes', async () => {
    const payload = Buffer.from('hello world');
    await driver.put('a/b/test.txt', Readable.from(payload), meta(payload.length));
    const got = await drainStream(await driver.getReadStream('a/b/test.txt'));
    expect(got.equals(payload)).toBe(true);
  });

  it('exists returns false for missing keys', async () => {
    expect(await driver.exists('does/not/exist')).toBe(false);
  });

  it('signed URL is a valid string', async () => {
    await driver.put('signed/key', Readable.from(Buffer.from('x')), meta(1));
    const url = await driver.getSignedUrl('signed/key', 60);
    expect(url).toMatch(/^https?:\/\/|^\//);
  });

  it('delete removes the object', async () => {
    await driver.put('to-delete', Readable.from(Buffer.from('x')), meta(1));
    await driver.delete('to-delete');
    expect(await driver.exists('to-delete')).toBe(false);
  });
}

export function describeMultipartStorageDriver(factory: () => Promise<MultipartStorageDriver>): void {
  let driver: MultipartStorageDriver;

  beforeAll(async () => {
    driver = await factory();
  });

  it('completes a multipart upload assembled from multiple parts', async () => {
    const key = 'multipart/test';
    const uploadId = await driver.createMultipartUpload(key, meta(0));
    const part1 = Buffer.alloc(5 * 1024 * 1024, 1);
    const part2 = Buffer.alloc(1024, 2);
    const etag1 = await driver.uploadPart(uploadId, key, 1, part1);
    const etag2 = await driver.uploadPart(uploadId, key, 2, part2);
    await driver.completeMultipartUpload(uploadId, key, [
      { partNumber: 1, etag: etag1 },
      { partNumber: 2, etag: etag2 },
    ]);
    const got = await drainStream(await driver.getReadStream(key));
    expect(got.length).toBe(part1.length + part2.length);
  });

  it('abort makes the upload unrecoverable', async () => {
    const key = 'multipart/aborted';
    const uploadId = await driver.createMultipartUpload(key, meta(0));
    await driver.uploadPart(uploadId, key, 1, Buffer.alloc(1024, 9));
    await driver.abortMultipartUpload(uploadId, key);
    expect(await driver.exists(key)).toBe(false);
  });
}
