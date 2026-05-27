import { signal } from '@angular/core';
import { StorageFile, UploadStatus } from '@otwld/ts-storage';
import { DetailedError, Upload } from 'tus-js-client';
import { StorageClientError, StorageClientErrorCode } from '../exceptions/storage-client-error';
import { UploadOptions } from '../models/upload-options';
import { UploadTask } from '../models/upload-task';
import { RequiredStorageConfig } from '../provide-storage';
import { createFileHash } from '../utils/storage-utils';
import { LocalStorageUrlStorage } from './local-storage-url-storage';

export interface UploadTaskCallbacks {
  onUpdate(): void;
  onComplete(task: UploadTaskImpl): void;
  onError(task: UploadTaskImpl, error: Error): void;
}

export class UploadTaskImpl implements UploadTask {
  readonly id = crypto.randomUUID();
  readonly file: File;

  private readonly _status = signal<UploadStatus>(UploadStatus.Pending);
  private readonly _progress = signal(0);
  private readonly _bytesUploaded = signal(0);
  private readonly _error = signal<Error | null>(null);
  private readonly _storageFile = signal<StorageFile | null>(null);
  private readonly _retryAttempt = signal(0);
  private readonly _nextRetryIn = signal(0);

  readonly status = this._status.asReadonly();
  readonly progress = this._progress.asReadonly();
  readonly bytesUploaded = this._bytesUploaded.asReadonly();
  readonly error = this._error.asReadonly();
  readonly storageFile = this._storageFile.asReadonly();
  readonly retryAttempt = this._retryAttempt.asReadonly();
  readonly nextRetryIn = this._nextRetryIn.asReadonly();

  _fingerprint = '';
  private tus?: Upload;
  private startOperation = 0;
  private starting = false;

  constructor(
    file: File,
    private readonly options: UploadOptions,
    private readonly config: RequiredStorageConfig,
    private readonly callbacks: UploadTaskCallbacks,
  ) {
    this.file = file;
  }

  start(): void {
    if (this.starting || this._status() === UploadStatus.Active) return;
    this.starting = true;
    this._status.set(UploadStatus.Active);
    this.callbacks.onUpdate();
    const operation = ++this.startOperation;
    void this.startTusUpload(operation).finally(() => {
      if (operation === this.startOperation) this.starting = false;
    });
  }

  pause(): void {
    this.startOperation++;
    this.starting = false;
    void this.tus?.abort();
    this._status.set(UploadStatus.Paused);
    this.callbacks.onUpdate();
  }

  resume(): void {
    this.start();
  }

  cancel(): void {
    this.startOperation++;
    this.starting = false;
    void this.tus?.abort(true);
    const error = new StorageClientError(StorageClientErrorCode.CANCELLED, 'Upload was cancelled');
    this._error.set(error);
    this._status.set(UploadStatus.Failed);
    this.callbacks.onError(this, error);
    this.callbacks.onUpdate();
  }

  dispose(): void {
    if (this._status() !== UploadStatus.Completed) {
      this.startOperation++;
      this.starting = false;
      void this.tus?.abort();
    }
  }

  private async startTusUpload(operation: number): Promise<void> {
    this._fingerprint ||= await createFileHash(this.file);
    const tus = new Upload(this.file, {
      endpoint: this.config.tusEndpoint,
      chunkSize: this.options.chunkSize ?? this.config.chunkSize,
      retryDelays: this.options.retryDelays ?? this.config.retryDelays,
      metadata: {
        filename: this.file.name,
        mimetype: this.file.type || 'application/octet-stream',
        ...this.options.metadata,
      },
      fingerprint: async () => this._fingerprint,
      urlStorage: new LocalStorageUrlStorage(),
      removeFingerprintOnSuccess: false,
      onProgress: (bytesSent, bytesTotal) => {
        this._bytesUploaded.set(bytesSent);
        this._progress.set(bytesTotal ? Math.round((bytesSent / bytesTotal) * 100) : 0);
        this.callbacks.onUpdate();
      },
      onSuccess: (payload) => {
        const storageFile = payload.lastResponse.getHeader('Storage-File');
        if (storageFile) this._storageFile.set(JSON.parse(storageFile) as StorageFile);
        this._progress.set(100);
        this._status.set(UploadStatus.Completed);
        this.callbacks.onComplete(this);
        this.callbacks.onUpdate();
      },
      onError: (error) => {
        this._error.set(error);
        this._status.set(UploadStatus.Failed);
        this.callbacks.onError(this, error);
        this.callbacks.onUpdate();
      },
      onShouldRetry: (_error: DetailedError, retryAttempt) => {
        const delays = this.options.retryDelays ?? this.config.retryDelays;
        this._retryAttempt.set(retryAttempt + 1);
        this._nextRetryIn.set(delays[retryAttempt] ?? 0);
        this.callbacks.onUpdate();
        return retryAttempt < delays.length;
      },
    });

    if (operation !== this.startOperation || this._status() !== UploadStatus.Active) {
      void tus.abort();
      return;
    }

    this.tus = tus;
    const previous = await tus.findPreviousUploads();
    if (previous[0]) tus.resumeFromPreviousUpload(previous[0]);
    if (operation !== this.startOperation || this._status() !== UploadStatus.Active) {
      void tus.abort();
      if (this.tus === tus) this.tus = undefined;
      return;
    }
    tus.start();
  }
}
