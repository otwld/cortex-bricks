import type { Mocked } from 'vitest';
import { Readable } from 'node:stream';
import { Response } from 'express';
import { TusController } from './tus.controller';
import { TusModuleOptions } from './tus.module';
import { TusService } from './tus.service';

const fakeRes = (): Mocked<Response> => {
  const headers: Record<string, string> = {};
  const response: any = {
    setHeader: vi.fn((key: string, value: string) => {
      headers[key] = value;
    }),
    status: vi.fn().mockReturnThis(),
    send: vi.fn(),
    headers,
  };
  return response;
};

describe('TusController CORS headers', () => {
  it('echoes configured allowOrigin', () => {
    const options = {
      maxSize: 10,
      uploadStateTtl: 86400,
      cleanupIntervalMs: 1000,
      allowOrigin: 'https://app.example',
    } as unknown as TusModuleOptions;
    const controller = new TusController({} as TusService, options);
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
    const tus = {
      createUpload: vi
        .fn()
        .mockResolvedValue({
          uploadId: 'u1',
          offset: 0,
          expiresAt: new Date(),
        }),
    } as unknown as TusService;
    const controller = new TusController(tus, {
      maxSize: 10,
      uploadStateTtl: 86400,
      cleanupIntervalMs: 1000,
    });
    const response = fakeRes();
    const request = Readable.from([]) as any;
    request.header = () => 'application/octet-stream';

    await expect(
      (controller.create as any)(
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
    const tus = {
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
    } as unknown as TusService;
    const controller = new TusController(tus, {
      maxSize: 10,
      uploadStateTtl: 86400,
      cleanupIntervalMs: 1000,
    });
    const response = fakeRes();
    const request = Readable.from([Buffer.from('ab')]) as any;

    await (controller.patch as any)('u1', '0', undefined, request, response);

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
    const tus = {
      createUpload: vi
        .fn()
        .mockResolvedValue({
          uploadId: 'u1',
          offset: 4,
          expiresAt: new Date(),
        }),
    } as unknown as TusService;
    const controller = new TusController(tus, {
      maxSize: 10,
      uploadStateTtl: 86400,
      cleanupIntervalMs: 1000,
    });
    const response = fakeRes();
    const request = Readable.from([Buffer.from('abcd')]) as any;
    request.header = () => 'application/octet-stream';

    await expect(
      (controller.create as any)(
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
    const tus = {
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
    } as unknown as TusService;
    const controller = new TusController(tus, {
      maxSize: 10,
      uploadStateTtl: 86400,
      cleanupIntervalMs: 1000,
    });
    const response = fakeRes();
    const request = Readable.from([Buffer.from('xy')]) as any;

    await expect(
      (controller.patch as any)('u1', '3', undefined, request, response),
    ).rejects.toThrow(/exceeds/);

    expect(tus.appendChunk).not.toHaveBeenCalled();
  });
});
