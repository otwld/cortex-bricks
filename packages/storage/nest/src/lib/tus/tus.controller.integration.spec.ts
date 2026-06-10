import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { StorageDriver as StorageDriverKind } from '@otwld/ts-storage';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { StorageModule } from '../storage.module';
import { TusModule } from './tus.module';

describe('TusController (integration)', () => {
  let app: INestApplication | undefined;
  let mongo: MongoMemoryServer | undefined;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongo.getUri()),
        StorageModule.forRoot({
          driver: StorageDriverKind.Filesystem,
          filesystem: {
            rootPath: mkdtempSync(join(tmpdir(), 'sto-it-')),
            signedUrlSecret: 'a'.repeat(32),
          },
        }),
        TusModule.forRoot({ maxSize: 10 * 1024 * 1024 }),
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  function getApp(): INestApplication {
    if (!app) throw new Error('TUS integration app was not initialized.');
    return app;
  }

  it('OPTIONS advertises TUS capabilities', async () => {
    const response = await request(getApp().getHttpServer()).options(
      '/storage/tus',
    );
    expect(response.status).toBe(204);
    expect(response.headers['tus-extension']).toContain('creation');
    expect(response.headers['access-control-allow-methods']).toContain('PATCH');
  });

  it('full upload lifecycle: POST -> PATCH -> completion', async () => {
    const payload = Buffer.from('the quick brown fox');
    const create = await request(getApp().getHttpServer())
      .post('/storage/tus')
      .set('Tus-Resumable', '1.0.0')
      .set('Upload-Length', String(payload.length))
      .set(
        'Upload-Metadata',
        `filename ${Buffer.from('fox.txt').toString('base64')},mimetype ${Buffer.from('text/plain').toString('base64')}`,
      );
    expect(create.status).toBe(201);
    const location = create.headers['location'].split('/').pop() ?? '';
    const patch = await request(getApp().getHttpServer())
      .patch(`/storage/tus/${location}`)
      .set('Tus-Resumable', '1.0.0')
      .set('Upload-Offset', '0')
      .set('Content-Type', 'application/offset+octet-stream')
      .send(payload);
    expect(patch.status).toBe(204);
    expect(Number(patch.headers['upload-offset'])).toBe(payload.length);
  });
});
