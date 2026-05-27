import { Readable } from 'node:stream';
import { UploadMeta } from '@otwld/ts-storage';

/** Base contract implemented by concrete storage backends. */
export abstract class StorageDriver {
  /** Store a stream at the given driver-relative key. */
  /**
   * Runs put.
   *
   * @param key - key value.
   *
   * @param stream - stream value.
   *
   * @param meta - meta value.
   */
  abstract put(key: string, stream: Readable, meta: UploadMeta): Promise<void>;
  /** Remove the object at the given driver-relative key. */
  /**
   * Runs delete.
   *
   * @param key - key value.
   */
  abstract delete(key: string): Promise<void>;
  /** Create a signed read URL valid for the requested number of seconds. */
  /**
   * Runs get signed url.
   *
   * @param key - key value.
   *
   * @param expiresIn - expires in value.
   *
   * @returns The storage driver get signed url result.
   */
  abstract getSignedUrl(key: string, expiresIn: number): Promise<string>;
  /** Open a readable stream for a stored object. */
  /**
   * Runs get read stream.
   *
   * @param key - key value.
   *
   * @returns The storage driver get read stream result.
   */
  abstract getReadStream(key: string): Promise<Readable>;
  /** Return whether an object exists at the given key. */
  /**
   * Runs exists.
   *
   * @param key - key value.
   *
   * @returns The storage driver exists result.
   */
  abstract exists(key: string): Promise<boolean>;
}
