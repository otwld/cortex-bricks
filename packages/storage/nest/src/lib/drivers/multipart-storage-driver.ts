import { Part, UploadMeta } from '@otwld/ts-storage';
import { StorageDriver } from './storage-driver';

/** Storage driver contract for multipart-capable backends. */
export abstract class MultipartStorageDriver extends StorageDriver {
  /** Start a multipart upload for a key and return the driver upload id. */
  /**
   * Runs create multipart upload.
   *
   * @param key - key value.
   *
   * @param meta - meta value.
   *
   * @returns The multipart storage driver create multipart upload result.
   */
  abstract createMultipartUpload(key: string, meta: UploadMeta): Promise<string>;
  /** Upload one numbered multipart chunk and return its ETag. */
  /**
   * Runs upload part.
   *
   * @param uploadId - upload id value.
   *
   * @param key - key value.
   *
   * @param partNumber - part number value.
   *
   * @param chunk - chunk value.
   *
   * @returns The multipart storage driver upload part result.
   */
  abstract uploadPart(uploadId: string, key: string, partNumber: number, chunk: Buffer): Promise<string>;
  /** Complete a multipart upload by assembling the supplied parts. */
  /**
   * Runs complete multipart upload.
   *
   * @param uploadId - upload id value.
   *
   * @param key - key value.
   *
   * @param parts - parts value.
   */
  abstract completeMultipartUpload(uploadId: string, key: string, parts: Part[]): Promise<void>;
  /** Abort a multipart upload and remove any staged bytes. */
  /**
   * Runs abort multipart upload.
   *
   * @param uploadId - upload id value.
   *
   * @param key - key value.
   */
  abstract abortMultipartUpload(uploadId: string, key: string): Promise<void>;
}
