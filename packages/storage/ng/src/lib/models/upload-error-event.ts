import { UploadTask } from './upload-task';

/** Payload emitted when an upload task reports an error. */
export interface UploadErrorEvent {
  /** Task that failed. */
  task: UploadTask;
  /** Error reported by the upload implementation. */
  error: Error;
  /** Whether the UI may offer an immediate retry. */
  retryable: boolean;
  /** Current retry attempt number. */
  attempt: number;
}
