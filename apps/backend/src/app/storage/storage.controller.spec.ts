import { Test } from '@nestjs/testing';
import { SignedUrlService } from '@otwld/nest-storage';
import request = require('supertest');
import { StorageController } from './storage.controller';

describe(StorageController.name, () => {
  it('returns signed URLs in the shape expected by the Angular storage client', async () => {
    const signedUrls = { generate: jest.fn().mockResolvedValue('https://signed.example/file') } as unknown as SignedUrlService;
    const controller = new StorageController(signedUrls);

    await expect(controller.createSignedUrl({ key: 'uploads/file.txt', expiresIn: 600 })).resolves.toEqual({
      url: 'https://signed.example/file',
    });
    expect(signedUrls.generate).toHaveBeenCalledWith('uploads/file.txt', { expiresIn: 600 });
  });

  it('binds the JSON request body for signed URL requests', async () => {
    const signedUrls = { generate: jest.fn().mockResolvedValue('https://signed.example/file') };
    const moduleRef = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [{ provide: SignedUrlService, useValue: signedUrls }],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post('/storage/signed-url')
      .send({ key: 'uploads/file.txt', expiresIn: 600 })
      .expect(201)
      .expect({ url: 'https://signed.example/file' });

    expect(signedUrls.generate).toHaveBeenCalledWith('uploads/file.txt', { expiresIn: 600 });
    await app.close();
  });
});
