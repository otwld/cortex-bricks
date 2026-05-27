import { Signal } from '@angular/core';
import { StorageFile, UploadStatus } from '@otwld/ts-storage';

/** Read-only signal contract for a client-side upload task. */
export interface UploadTask {
  /** Stable task id. */
  readonly id: string;
  /** File associated with the task. */
  readonly file: File;
  /** Signal containing the current upload status. */
  readonly status: Signal<UploadStatus>;
  /** Signal containing percentage progress from 0 to 100. */
  readonly progress: Signal<number>;
  /** Signal containing uploaded byte count. */
  readonly bytesUploaded: Signal<number>;
  /** Signal containing the latest upload error, if any. */
  readonly error: Signal<Error | null>;
  /** Signal containing the persisted storage file after completion. */
  readonly storageFile: Signal<StorageFile | null>;
  /** Signal containing the current retry attempt. */
  readonly retryAttempt: Signal<number>;
  /** Signal containing milliseconds until the next retry. */
  readonly nextRetryIn: Signal<number>;
}
