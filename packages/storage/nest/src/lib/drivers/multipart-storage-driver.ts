import { Part, UploadMeta } from '@otwld/ts-storage';
import { StorageDriver } from './storage-driver';

/** Storage driver contract for multipart-capable backends. */
export abstract class MultipartStorageDriver extends StorageDriver {
  /** Start a multipart upload for a key and return the driver upload id. */
  abstract createMultipartUpload(key: string, meta: UploadMeta): Promise<string>;

  /** Upload one numbered multipart chunk and return its ETag. */
  abstract uploadPart(uploadId: string, key: string, partNumber: number, chunk: Buffer): Promise<string>;

  /** Complete a multipart upload by assembling the supplied parts. */
  abstract completeMultipartUpload(uploadId: string, key: string, parts: Part[]): Promise<void>;

  /** Abort a multipart upload and remove any staged bytes. */
  abstract abortMultipartUpload(uploadId: string, key: string): Promise<void>;
}
