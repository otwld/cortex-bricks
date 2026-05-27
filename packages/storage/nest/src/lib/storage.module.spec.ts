import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { StorageDriver as StorageDriverKind } from '@otwld/ts-storage';
import { FilesystemFileController } from './filesystem/filesystem-file.controller';
import { StorageFileRecord } from './schemas/storage-file.schema';
import { StorageModule } from './storage.module';
import { UploadState } from './schemas/upload-state.schema';
import { TusModule } from './tus/tus.module';

describe('StorageModule', () => {
  it('does not register FilesystemFileController when driver is S3', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        StorageModule.forRoot({
          driver: StorageDriverKind.S3,
          s3: { bucket: 'b', region: 'us-east-1' },
        }),
      ],
    })
      .overrideProvider(getModelToken(StorageFileRecord.name))
      .useValue({})
      .compile();

    expect(() => moduleRef.get(FilesystemFileController, { strict: false })).toThrow();
    await moduleRef.close();
  });

  it('registers FilesystemFileController when driver is filesystem', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        StorageModule.forRoot({
          driver: StorageDriverKind.Filesystem,
          filesystem: { rootPath: '/tmp/storage', signedUrlSecret: 'a'.repeat(32) },
        }),
      ],
    })
      .overrideProvider(getModelToken(StorageFileRecord.name))
      .useValue({})
      .compile();

    expect(moduleRef.get(FilesystemFileController, { strict: false })).toBeDefined();
    await moduleRef.close();
  });

  it('compiles when configured through forRootAsync', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        StorageModule.forRootAsync({
          useFactory: () => ({
            driver: StorageDriverKind.S3,
            s3: { bucket: 'b', region: 'us-east-1' },
          }),
        }),
      ],
    })
      .overrideProvider(getModelToken(StorageFileRecord.name))
      .useValue({})
      .compile();

    expect(moduleRef.get(StorageModule)).toBeDefined();
    await moduleRef.close();
  });

  it('does not register filesystem routes for async S3 storage by default', () => {
    const moduleDefinition = StorageModule.forRootAsync({
      useFactory: () => ({
        driver: StorageDriverKind.S3,
        s3: { bucket: 'b', region: 'us-east-1' },
      }),
    });

    expect(moduleDefinition.controllers).toEqual([]);
  });

  it('registers filesystem routes for async filesystem storage when explicitly enabled', () => {
    const moduleDefinition = StorageModule.forRootAsync({
      exposeFilesystemController: true,
      useFactory: () => ({
        driver: StorageDriverKind.Filesystem,
        filesystem: { rootPath: '/tmp/storage', signedUrlSecret: 'a'.repeat(32) },
      }),
    });

    expect(moduleDefinition.controllers).toEqual([FilesystemFileController]);
  });

  it('shares async storage options with TusModule', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        StorageModule.forRootAsync({
          useFactory: () => ({
            driver: StorageDriverKind.S3,
            s3: { bucket: 'b', region: 'us-east-1' },
          }),
        }),
        TusModule.forRoot(),
      ],
    })
      .overrideProvider(getModelToken(StorageFileRecord.name))
      .useValue({})
      .overrideProvider(getModelToken(UploadState.name))
      .useValue({})
      .compile();

    expect(moduleRef.get(TusModule)).toBeDefined();
    await moduleRef.close();
  });
});
