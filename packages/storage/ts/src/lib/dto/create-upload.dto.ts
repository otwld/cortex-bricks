import { UploadMeta } from '../interfaces/upload-meta.interface';

/** Request body for creating a resumable upload. */
export interface CreateUploadDto extends UploadMeta {
  /** Optional checksum supplied for the initial upload chunk. */
  checksum?: string;
}
