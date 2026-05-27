import { StorageDriver } from '@otwld/ts-storage';
import {
  StorageException,
  StorageExceptionCode,
} from '../exceptions/storage.exception';
import { HookRunnerService } from './hook-runner.service';
import { StorageHook } from './storage-hook';

describe(HookRunnerService.name, () => {
  it('runs registered hooks in declaration order for each lifecycle phase', async () => {
    const calls: string[] = [];
    const hooks: StorageHook[] = [
      {
        beforeUpload: async () => {
          calls.push('clamav');
        },
      },
      {
        beforeUpload: async () => {
          calls.push('thumbnail');
        },
      },
      {
        beforeUpload: async () => {
          calls.push('audit');
        },
      },
    ];
    const runner = new HookRunnerService(hooks);

    await runner.run('beforeUpload', {
      filename: 'image.png',
      mimetype: 'image/png',
      size: 1,
    });

    expect(calls).toEqual(['clamav', 'thumbnail', 'audit']);
  });

  it('passes uploaded file documents through afterUpload hooks', async () => {
    const hook = { afterUpload: vi.fn() } satisfies StorageHook;
    const runner = new HookRunnerService([hook]);
    const file = {
      id: 'file-1',
      key: 'a.txt',
      filename: 'a.txt',
      mimetype: 'text/plain',
      size: 1,
      driver: StorageDriver.Filesystem,
      checksum: 'hash',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await runner.run('afterUpload', file as never);

    expect(hook.afterUpload).toHaveBeenCalledWith(file);
  });

  it('wraps thrown errors from hooks as HOOK_REJECTED', async () => {
    const failing: any = {
      beforeUpload: () => {
        throw new Error('virus');
      },
    };
    const runner = new HookRunnerService([failing]);
    await expect(
      runner.run('beforeUpload', {
        filename: 'f',
        mimetype: 'application/octet-stream',
        size: 1,
      }),
    ).rejects.toMatchObject({
      code: StorageExceptionCode.HOOK_REJECTED,
    });
  });

  it('preserves a hook-thrown StorageException unchanged', async () => {
    const explicit: any = {
      beforeUpload: () => {
        throw StorageException.fileNotFound();
      },
    };
    const runner = new HookRunnerService([explicit]);
    await expect(
      runner.run('beforeUpload', {
        filename: 'f',
        mimetype: 'application/octet-stream',
        size: 1,
      }),
    ).rejects.toMatchObject({
      code: StorageExceptionCode.FILE_NOT_FOUND,
    });
  });
});
