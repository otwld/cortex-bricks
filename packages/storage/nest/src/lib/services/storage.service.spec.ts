import { createHash } from 'node:crypto';
import { PassThrough, Readable } from 'node:stream';
import { StorageDriver as StorageDriverKind } from '@otwld/ts-storage';
import { StorageDriver } from '../drivers/storage-driver';
import { HookRunnerService } from '../hooks/hook-runner.service';
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

const fakeModel = () => {
  const created: any[] = [];
  return {
    create: vi.fn(async (doc) => {
      const record = {
        ...doc,
        _id: 'id',
        deletedAt: undefined,
        save: vi.fn(),
        checksum: doc.checksum,
      };
      created.push(record);
      return record;
    }),
    findById: vi
      .fn()
      .mockReturnValue({ exec: vi.fn().mockResolvedValue(null) }),
    deleteOne: vi
      .fn()
      .mockReturnValue({
        exec: vi.fn().mockResolvedValue({ deletedCount: 1 }),
      }),
    find: vi.fn().mockReturnValue({ exec: vi.fn().mockResolvedValue([]) }),
    created,
  };
};

describe('StorageService.putFile', () => {
  it('hashes exactly the bytes streamed to the driver', async () => {
    const driver = new FakeDriver();
    const model = fakeModel() as any;
    const hooks = new HookRunnerService();
    const service = new StorageService(driver as any, hooks, model);
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
    expect(model.created[0].checksum).toBe(
      createHash('sha256').update(payload).digest('hex'),
    );
  });

  it('rejects streams that exceed the configured max size before creating a record', async () => {
    const driver = new FakeDriver();
    const model = fakeModel() as any;
    const hooks = new HookRunnerService();
    const service = new StorageService(driver as any, hooks, model);
    const payload = Buffer.from('too large');

    await expect(
      service.putFile(
        'docs/large.txt',
        Readable.from(payload),
        { filename: 'large.txt', mimetype: 'text/plain', size: payload.length },
        { driver: StorageDriverKind.S3, maxSize: payload.length - 1 } as never,
      ),
    ).rejects.toThrow(/exceeded/i);
    expect(model.create).not.toHaveBeenCalled();
  });
});
