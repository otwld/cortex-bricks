import { Readable } from 'node:stream';
import { TusController, type TusHttpRequest, type TusHttpResponse } from './tus.controller';
import { TusModuleOptions } from './tus.module';

type TusServiceMock = ConstructorParameters<typeof TusController>[0];

class TusRequestMock extends Readable implements TusHttpRequest {
  private chunkIndex = 0;

  public readonly header = vi.fn((name: string) =>
    name.toLowerCase() === 'content-type' ? this.contentType : undefined,
  );

  public constructor(
    private readonly chunks: Buffer[] = [],
    private readonly contentType = 'application/octet-stream',
  ) {
    super();
  }

  public override _read(): void {
    this.push(this.chunks[this.chunkIndex++] ?? null);
  }
}

class TusResponseMock implements TusHttpResponse {
  public readonly headers: Record<string, string> = {};

  public readonly setHeader = vi.fn((key: string, value: string | number | readonly string[]) => {
    this.headers[key] = Array.isArray(value) ? value.join(',') : String(value);
    return this;
  });

  public readonly status = vi.fn(() => this);

  public readonly send = vi.fn(() => this);
}

const createTusService = (overrides: Partial<TusServiceMock> = {}): TusServiceMock => ({
  createUpload: vi.fn(),
  getUpload: vi.fn(),
  appendChunk: vi.fn(),
  abortUpload: vi.fn(),
  ...overrides,
});

const fakeReq = (
  chunks: Buffer[] = [],
  contentType = 'application/octet-stream',
): TusRequestMock => {
  return new TusRequestMock(chunks, contentType);
};

const fakeRes = (): TusResponseMock => new TusResponseMock();

describe('TusController CORS headers', () => {
  it('echoes configured allowOrigin', () => {
    const options: TusModuleOptions = {
      maxSize: 10,
      uploadStateTtl: 86400,
      cleanupIntervalMs: 1000,
      allowOrigin: 'https://app.example',
    };
    const controller = new TusController(createTusService(), options);
    const response = fakeRes();

    controller.advertise(response);

    expect(response.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Origin',
      'https://app.example',
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Methods',
      'POST,HEAD,PATCH,DELETE,OPTIONS',
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      expect.stringMatching(/^Access-Control-Expose-Headers$/i),
      expect.stringContaining('Storage-File'),
    );
  });

  it('rejects POST without Upload-Length and without Upload-Defer-Length', async () => {
    const tus = createTusService({
      createUpload: vi
        .fn()
        .mockResolvedValue({
          uploadId: 'u1',
          offset: 0,
          expiresAt: new Date(),
        }),
    });
    const controller = new TusController(tus, {
      maxSize: 10,
      uploadStateTtl: 86400,
      cleanupIntervalMs: 1000,
    });
    const response = fakeRes();
    const request = fakeReq();

    await expect(
      controller.create(
        undefined,
        undefined,
        undefined,
        request,
        response,
        undefined,
      ),
    ).rejects.toThrow(/Upload-Length/);
  });

  it('exposes stored file metadata on the final PATCH response', async () => {
    const storageFile = {
      id: 'file-1',
      key: 'uploads/a.txt',
      filename: 'a.txt',
      mimetype: 'text/plain',
      size: 2,
      driver: 'filesystem',
      checksum: 'hash',
      metadata: { source: 'dashboard-filedemo' },
      createdAt: new Date('2026-05-07T00:00:00.000Z'),
      updatedAt: new Date('2026-05-07T00:00:00.000Z'),
    };
    const tus = createTusService({
      appendChunk: vi.fn().mockResolvedValue({
        uploadId: 'u1',
        offset: 2,
        length: 2,
        expiresAt: new Date(),
        file: storageFile,
      }),
      getUpload: vi.fn().mockResolvedValue({
        uploadId: 'u1',
          offset: 0,
          length: 2,
          expiresAt: new Date(),
        }),
    });
    const controller = new TusController(tus, {
      maxSize: 10,
      uploadStateTtl: 86400,
      cleanupIntervalMs: 1000,
    });
    const response = fakeRes();
    const request = fakeReq([Buffer.from('ab')]);

    await controller.patch('u1', '0', undefined, request, response);

    expect(response.setHeader).toHaveBeenCalledWith(
      'Storage-File',
      JSON.stringify(storageFile),
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      expect.stringMatching(/^Access-Control-Expose-Headers$/i),
      expect.stringContaining('Storage-File'),
    );
  });

  it('rejects creation-with-upload bodies larger than Upload-Length before creating state', async () => {
    const tus = createTusService({
      createUpload: vi
        .fn()
        .mockResolvedValue({
          uploadId: 'u1',
          offset: 4,
          expiresAt: new Date(),
        }),
    });
    const controller = new TusController(tus, {
      maxSize: 10,
      uploadStateTtl: 86400,
      cleanupIntervalMs: 1000,
    });
    const response = fakeRes();
    const request = fakeReq([Buffer.from('abcd')]);

    await expect(
      controller.create(
        '3',
        undefined,
        undefined,
        request,
        response,
        undefined,
      ),
    ).rejects.toThrow(/exceeds/);

    expect(tus.createUpload).not.toHaveBeenCalled();
  });

  it('limits PATCH buffering to the remaining upload length', async () => {
    const tus = createTusService({
      getUpload: vi.fn().mockResolvedValue({
        uploadId: 'u1',
        offset: 3,
        length: 4,
        expiresAt: new Date(),
      }),
      appendChunk: vi.fn().mockResolvedValue({
        uploadId: 'u1',
          offset: 5,
          length: 4,
          expiresAt: new Date(),
        }),
    });
    const controller = new TusController(tus, {
      maxSize: 10,
      uploadStateTtl: 86400,
      cleanupIntervalMs: 1000,
    });
    const response = fakeRes();
    const request = fakeReq([Buffer.from('xy')]);

    await expect(
      controller.patch('u1', '3', undefined, request, response),
    ).rejects.toThrow(/exceeds/);

    expect(tus.appendChunk).not.toHaveBeenCalled();
  });
});
