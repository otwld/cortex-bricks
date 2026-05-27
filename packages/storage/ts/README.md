# @otwld/ts-storage

Shared storage contracts consumed by the Nest and Angular storage packages.

```ts
import { StorageDriver, UploadStatus, type StorageFile, type UploadMeta } from '@otwld/ts-storage';

const meta: UploadMeta = {
  filename: 'invoice.pdf',
  mimetype: 'application/pdf',
  size: 42_000,
  metadata: { ownerId: 'user-1' },
};

const file: StorageFile = {
  id: 'file-1',
  key: 'invoices/invoice.pdf',
  filename: meta.filename,
  mimetype: meta.mimetype,
  size: meta.size,
  driver: StorageDriver.S3,
  checksum: 'sha256-hex',
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

Exports:

- `StorageDriver`
- `UploadStatus` and `GroupStatus`
- `StorageFile`, `UploadMeta`, and `Part`
- `CreateUploadDto`, `CompleteUploadDto`, and `SignedUrlRequestDto`
