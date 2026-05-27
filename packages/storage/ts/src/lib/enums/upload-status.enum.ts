/** Lifecycle state for a single upload task. */
export enum UploadStatus {
  /** Upload is queued but has not started. */
  Pending = 'pending',
  /** Upload is currently sending bytes. */
  Active = 'active',
  /** Upload was paused and can be resumed. */
  Paused = 'paused',
  /** Upload finished successfully. */
  Completed = 'completed',
  /** Upload failed or was cancelled. */
  Failed = 'failed',
}

/** Aggregate status for a group of upload tasks. */
export type GroupStatus = 'pending' | 'active' | 'partial' | 'completed' | 'failed';
