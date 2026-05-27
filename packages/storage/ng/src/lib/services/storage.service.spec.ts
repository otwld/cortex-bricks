import { provideHttpClient } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UploadStatus } from '@otwld/ts-storage';
import { vi } from 'vitest';
import { UploadTaskImpl } from '../internal/upload-task.impl';
import { provideStorage, RequiredStorageConfig } from '../provide-storage';
import { StorageClientErrorCode } from '../exceptions';
import { StorageService } from './storage.service';

const tusMocks = vi.hoisted(() => ({
  Upload: vi.fn(),
  abort: vi.fn(),
  findPreviousUploads: vi.fn(),
  resumeFromPreviousUpload: vi.fn(),
  start: vi.fn(),
}));

vi.mock('tus-js-client', () => ({
  Upload: tusMocks.Upload,
}));

describe(StorageService.name, () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    tusMocks.abort.mockReset().mockResolvedValue(undefined);
    tusMocks.findPreviousUploads.mockReset().mockResolvedValue([]);
    tusMocks.resumeFromPreviousUpload.mockReset();
    tusMocks.start.mockReset();
    tusMocks.Upload.mockReset().mockImplementation(function UploadMock() {
      return {
        abort: tusMocks.abort,
        findPreviousUploads: tusMocks.findPreviousUploads,
        resumeFromPreviousUpload: tusMocks.resumeFromPreviousUpload,
        start: tusMocks.start,
      };
    });
  });

  function createUploadTask(file = new File(['x'], 'a.txt', { type: 'text/plain' })) {
    const config: RequiredStorageConfig = {
      tusEndpoint: '/tus',
      signedUrlEndpoint: '/signed-url',
      defaultExpiresIn: 3600,
      retryDelays: [],
      chunkSize: 1024,
      signedUrlRefreshThresholdMs: 60_000,
    };

    return new UploadTaskImpl(file, {}, config, {
      onComplete: vi.fn(),
      onError: vi.fn(),
      onUpdate: vi.fn(),
    });
  }

  async function flushPromises(): Promise<void> {
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  async function waitForUploadConstruction(): Promise<void> {
    for (let attempt = 0; attempt < 20 && tusMocks.Upload.mock.calls.length === 0; attempt++) {
      await flushPromises();
    }
  }

  function createDelayedHashFile() {
    let resolveHashRead!: (value: ArrayBuffer) => void;
    const hashRead = new Promise<ArrayBuffer>((resolve) => {
      resolveHashRead = resolve;
    });
    const file = new File([new Uint8Array([1])], 'a.bin', { type: 'application/octet-stream' });
    Object.defineProperty(file, 'arrayBuffer', {
      configurable: true,
      value: vi.fn(() => hashRead),
    });

    return {
      file,
      finishHashRead: () => resolveHashRead(new Uint8Array([1]).buffer),
    };
  }

  it('throws a typed error when upload is called during SSR', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideStorage({ tusEndpoint: '/tus', signedUrlEndpoint: '/signed-url' }), { provide: PLATFORM_ID, useValue: 'server' }],
    });
    const service = TestBed.inject(StorageService);
    const file = new File(['x'], 'a.txt', { type: 'text/plain' });

    expect(() => service.upload(file)).toThrow(expect.objectContaining({ code: StorageClientErrorCode.NOT_BROWSER }));
  });

  it('tracks uploaded tasks with read-only signal state', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideStorage({ tusEndpoint: '/tus', signedUrlEndpoint: '/signed-url' }),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    const service = TestBed.inject(StorageService);
    const file = new File(['x'], 'a.txt', { type: 'text/plain' });

    const task = service.upload(file, { autoStart: false });

    expect(task.status()).toBe(UploadStatus.Pending);
    expect(task.progress()).toBe(0);
    expect(service.tasks()).toEqual([task]);
    expect('set' in task.status).toBe(false);
  });

  it('disposes tracked uploads on service destruction', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideStorage({ tusEndpoint: '/tus', signedUrlEndpoint: '/signed-url' }),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    const service = TestBed.inject(StorageService);
    const file = new File([new Uint8Array([1, 2, 3])], 'a.bin');
    const task = service.upload(file, { autoStart: false });
    const spy = vi.spyOn(task as unknown as { dispose: () => void }, 'dispose');

    TestBed.resetTestingModule();

    expect(spy).toHaveBeenCalled();
  });

  it('does not start a stale tus upload after pause during async preparation', async () => {
    const delayed = createDelayedHashFile();
    const task = createUploadTask(delayed.file);

    task.start();
    task.pause();
    delayed.finishHashRead();
    await waitForUploadConstruction();

    expect(tusMocks.start).not.toHaveBeenCalled();
    expect(task.status()).toBe(UploadStatus.Paused);
  });

  it('creates only one tus upload for repeated start calls while preparing', async () => {
    const delayed = createDelayedHashFile();
    const task = createUploadTask(delayed.file);

    task.start();
    task.start();
    delayed.finishHashRead();
    await waitForUploadConstruction();

    expect(tusMocks.Upload).toHaveBeenCalledTimes(1);
  });
});
