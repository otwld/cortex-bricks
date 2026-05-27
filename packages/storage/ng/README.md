# @otwld/ng-storage/core

Signal-based Angular client for TUS uploads and signed storage URLs.

## Bootstrap

```ts
import { provideStorage } from '@otwld/ng-storage/core';

bootstrapApplication(AppComponent, {
  providers: [
    provideStorage({
      tusEndpoint: '/api/storage/tus',
      signedUrlEndpoint: '/api/storage/signed-url',
      defaultExpiresIn: 3600,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      chunkSize: 5 * 1024 * 1024,
      signedUrlRefreshThresholdMs: 60_000,
    }),
  ],
});
```

## Upload Service

```ts
const storage = inject(StorageService);
const task = storage.upload(file, {
  accept: 'image/*,.pdf',
  maxSize: 20 * 1024 * 1024,
  metadata: { ownerId: userId },
});

task.status();
task.progress();
task.error();
```

Groups expose aggregate state:

```ts
const group = storage.uploadGroup(files);
group.progress();
group.status();
group.pause();
group.resume();
group.cancel();
```

Uploads are browser-only. Calling `upload()` during SSR throws `StorageClientErrorCode.NOT_BROWSER`.

## Directives

```html
<input type="file" multiple [stoUpload]="{ accept: 'image/*' }" (uploadStart)="task = $event" (uploadComplete)="file = $event" (uploadError)="error = $event" />

<div [stoDropZone]="{ multiple: true }" (filesDropped)="files = $event"></div>
```

## Pipes

```html
{{ file.size | stoBytes }} {{ task | stoProgress }} <img [src]="file.key | stoSignedUrl | async" alt="" />
```

`stoSignedUrl` uses `SignedUrlCacheService` to dedupe parallel requests and refresh URLs before expiry.

## Utilities

```ts
formatBytes(file.size);
isMimeTypeAllowed(file, 'image/*,.pdf');
getUploadProgress(storage.tasks());
groupByStatus(storage.tasks());
await createFileHash(file);
```

### Pause / resume / cancel

```ts
const task = storage.upload(file);
storage.pause(task.id);
storage.resume(task.id);
storage.cancel(task.id);
```

### Cross-session resume

The library SHA-256 hashes each file and stores the resume URL in `localStorage`. Re-selecting the same file picks up where the upload stopped while the server-side upload state is still alive.

```ts
const task = storage.upload(droppedFile);
```

### `stoUpload` directive (input only)

```html
<input type="file" [stoUpload]="{ accept: '.pdf', maxSize: 10485760 }" (uploadComplete)="onPdf($event)" />
```

### `stoDropZone` directive (drop only)

```html
<div [stoDropZone]="{ multiple: true }" (filesDropped)="onDropped($event)" class="rounded-lg border-2 border-dashed p-6">Drop files</div>
```

### Combined drop-zone + click-to-browse

```html
<label [stoDropZone]="{}" class="block">
  <input type="file" [stoUpload]="{}" multiple class="hidden" />
  <span>Click or drag</span>
</label>
```

### Retry-state UI

```html
@if (task.retryAttempt() > 0 && task.status() === 'failed') {
  <span>Retrying in {{ task.nextRetryIn() / 1000 }}s (attempt {{ task.retryAttempt() }})</span>
}
```

### Error handling

```html
@if (task.error(); as err) {
  <div role="alert">{{ err.message }}</div>
}
```

### Custom upload validation

```ts
storage.upload(file, { accept: 'image/*', maxSize: 5 * 1024 * 1024 });
```

### SSR-safe pattern

`StorageService.upload()` throws on the server. Guard your call sites:

```ts
if (isPlatformBrowser(this.platformId)) this.storage.upload(file);
```
