/** Metadata supplied by callers when creating an upload. */
export interface UploadMeta {
  /** Original or normalized file name. */
  filename: string;
  /** MIME type for the upload payload. */
  mimetype: string;
  /** Expected payload size in bytes. */
  size: number;
  /** Optional metadata to persist with the stored object. */
  metadata?: Record<string, string>;
}
