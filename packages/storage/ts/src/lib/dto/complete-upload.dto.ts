import { Part } from '../interfaces/multipart-part.interface';

/** Request body for completing a multipart upload. */
export interface CompleteUploadDto {
  /** Driver upload id returned by upload creation. */
  uploadId: string;
  /** Ordered or unordered part list to assemble. */
  parts: Part[];
}
