# @otwld/nest-storage

NestJS storage module with filesystem and S3 drivers, TUS resumable uploads, signed URL generation, Mongoose file records, soft delete, and upload hooks.

## Filesystem Setup

```ts
import { StorageDriver } from '@otwld/ts-storage';
import { StorageModule, TusModule } from '@otwld/nest-storage';

@Module({
  imports: [
    StorageModule.forRoot({
      driver: StorageDriver.Filesystem,
      filesystem: {
        rootPath: '/uploads',
        signedUrlSecret: process.env.STORAGE_SIGNED_URL_SECRET!,
        signedUrlTtl: 3600,
        publicPath: '/storage/files',
      },
    }),
    TusModule.forRoot({
      path: '/storage/tus',
      maxSize: 10 * 1024 * 1024 * 1024,
      uploadStateTtl: 86400,
      cleanupIntervalMs: 6 * 60 * 60 * 1000,
    }),
  ],
})
export class AppModule {}
```

`FilesystemFileController` serves signed filesystem URLs at `/storage/files/:token`.

## S3 Setup

Install the optional AWS peers in applications that use S3:

```bash
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

```ts
StorageModule.forRoot({
  driver: StorageDriver.S3,
  s3: {
    bucket: process.env.S3_BUCKET!,
    region: process.env.AWS_REGION!,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
```

The S3 driver lazy-imports AWS SDK modules so filesystem-only apps do not load them.

## Async Setup

```ts
StorageModule.forRootAsync({
  useFactory: (config: ConfigService) => ({
    driver: StorageDriver.S3,
    s3: {
      bucket: config.getOrThrow('S3_BUCKET'),
      region: config.getOrThrow('AWS_REGION'),
    },
  }),
  inject: [ConfigService],
});
```

## Hooks

```ts
@Injectable()
class AuditHook extends StorageHook {
  async afterUpload(file: StorageHookFile) {
    console.log('uploaded', file.key);
  }
}

StorageModule.forRoot({
  driver: StorageDriver.Filesystem,
  filesystem: { rootPath: '/uploads', signedUrlSecret: 'a'.repeat(32) },
  hooks: [AuditHook],
});
```

Hooks support `beforeUpload`, `afterUpload`, `beforeDelete`, and `afterDelete`. Throw in `beforeUpload` to reject an upload.

## StorageService

```ts
const files = await storage.listFiles({ ownerId: user.id });
const url = await storage.getSignedUrl(files[0].key, 600);
await storage.deleteFile(files[0].id);
await storage.deleteFile(files[0].id, { hard: true });
```

## Signed URLs Behind Guards

```ts
@Post('storage/signed-url')
@CheckPolicies((ability) => ability.can('read', 'File'))
generate(@Body() body: SignedUrlRequestDto) {
  return this.signedUrls.generate(body.key, { expiresIn: body.expiresIn });
}
```

## Direct Driver Migration

```ts
await driver.put('legacy/avatar.png', createReadStream('/legacy/avatar.png'), { filename: 'avatar.png', mimetype: 'image/png', size });
```

### Custom hook - thumbnail generation with `sharp`

```ts
import { Readable } from 'node:stream';
import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { StorageDriver, StorageHook, StorageHookFile, StorageService } from '@otwld/nest-storage';

@Injectable()
export class ThumbnailHook extends StorageHook {
  constructor(
    private readonly storage: StorageService,
    private readonly driver: StorageDriver,
  ) {
    super();
  }

  async afterUpload(file: StorageHookFile): Promise<void> {
    if (!file.mimetype.startsWith('image/')) return;
    const stream = await this.driver.getReadStream(file.key);
    const thumb = await sharp(await streamToBuffer(stream)).resize(256, 256, { fit: 'cover' }).webp().toBuffer();
    await this.driver.put(`${file.key}.thumb.webp`, Readable.from(thumb), {
      filename: `${file.filename}.thumb.webp`,
      mimetype: 'image/webp',
      size: thumb.length,
    });
  }
}
```

### Custom hook - audit logging

```ts
import { Injectable, Logger } from '@nestjs/common';
import { StorageHook, StorageHookFile } from '@otwld/nest-storage';

@Injectable()
export class AuditHook extends StorageHook {
  private readonly logger = new Logger(AuditHook.name);

  async afterUpload(file: StorageHookFile): Promise<void> {
    this.logger.log(`Uploaded ${file.id} by ${file.ownerId ?? 'system'}`);
  }

  async afterDelete(file: StorageHookFile): Promise<void> {
    this.logger.warn(`Deleted ${file.id}`);
  }
}
```

### Soft delete vs. hard delete

```ts
await storage.deleteFile(id);
await storage.deleteFile(id, { hard: true });
```

### Listing files with filter

```ts
const owned = await storage.listFiles({ ownerId: user.id });
const allIncludingDeleted = await storage.listFiles({}, { includeDeleted: true });
```

### Validating a checksum after upload

```ts
const expected = sha256(localBuffer);
const actual = await storage.getChecksum(file.id);
if (actual !== expected) throw new Error('Checksum mismatch - file may be corrupt');
```
