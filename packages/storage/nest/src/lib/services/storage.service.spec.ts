import { createHash } from 'node:crypto';
import { PassThrough, Readable } from 'node:stream';
import { StorageDriver as StorageDriverKind } from '@otwld/ts-storage';
import { StorageDriver } from '../drivers/storage-driver';
import { HookRunnerService } from '../hooks/hook-runner.service';
import { StorageFileRecord } from '../schemas/storage-file.schema';
import { createMemoryModel } from '../testing/memory-model';
import { StorageService } from './storage.service';

class FakeDriver extends StorageDriver {
  received = Buffer.alloc(0);

  put = vi.fn(async (_key: string, stream: Readable) => {
    for await (const chunk of stream)
      this.received = Buffer.concat([this.received, chunk as Buffer]);
  });

  delete = vi.fn();
  getSignedUrl = vi.fn();
  getReadStream = vi.fn();
  exists = vi.fn();
}

describe('StorageService.putFile', () => {
  it('hashes exactly the bytes streamed to the driver', async () => {
    const driver = new FakeDriver();
    const model = createMemoryModel<StorageFileRecord>();
    const hooks = new HookRunnerService();
    const service = new StorageService(driver, hooks, model);
    const payload = Buffer.from('the quick brown fox jumps over the lazy dog');
    const stream = new PassThrough();
    stream.end(payload);

    await service.putFile(
      'docs/fox.txt',
      stream,
      { filename: 'fox.txt', mimetype: 'text/plain', size: payload.length },
      { driver: StorageDriverKind.S3 },
    );

    expect(driver.received.equals(payload)).toBe(true);
    expect(model.rows[0].checksum).toBe(
      createHash('sha256').update(payload).digest('hex'),
    );
  });

  it('rejects streams that exceed the configured max size before creating a record', async () => {
    const driver = new FakeDriver();
    const model = createMemoryModel<StorageFileRecord>();
    const hooks = new HookRunnerService();
    const service = new StorageService(driver, hooks, model);
    const payload = Buffer.from('too large');

    await expect(
      service.putFile(
        'docs/large.txt',
        Readable.from(payload),
        { filename: 'large.txt', mimetype: 'text/plain', size: payload.length },
        { driver: StorageDriverKind.S3, maxSize: payload.length - 1 },
      ),
    ).rejects.toThrow(/exceeded/i);
    expect(model.rows).toHaveLength(0);
  });
});
