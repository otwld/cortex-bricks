/** Completed part descriptor used to finalize multipart uploads. */
export interface Part {
  /** One-based part number. */
  partNumber: number;
  /** Driver-provided entity tag or checksum for the part. */
  etag: string;
}
