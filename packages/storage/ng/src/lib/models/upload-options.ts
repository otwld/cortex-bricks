/** Options controlling a single file upload. */
export interface UploadOptions {
  /** Metadata merged into TUS Upload-Metadata. */
  metadata?: Record<string, string>;
  /** Accept rules matching file extensions, exact MIME types, or wildcard MIME groups. */
  accept?: string;
  /** Maximum file size in bytes. */
  maxSize?: number;
  /** TUS chunk size in bytes. */
  chunkSize?: number;
  /** Retry delays in milliseconds passed to tus-js-client. */
  retryDelays?: number[];
  /** Whether to start immediately after creating the task. */
  autoStart?: boolean;
}

/** Options controlling grouped uploads. */
export interface GroupUploadOptions extends UploadOptions {
  /** Optional caller-provided group id. */
  groupId?: string;
}

/** Options accepted by the drop-zone directive. */
export interface DropZoneOptions extends UploadOptions {
  /** Whether multiple dropped files are accepted. */
  multiple?: boolean;
  /** Whether drop handling is disabled. */
  disabled?: boolean;
}
