import { Readable } from 'node:stream';
import { UploadMeta } from '@otwld/ts-storage';

/** Base contract implemented by concrete storage backends. */
export abstract class StorageDriver {
  /** Store a stream at the given driver-relative key. */
  abstract put(key: string, stream: Readable, meta: UploadMeta): Promise<void>;

  /** Remove the object at the given driver-relative key. */
  abstract delete(key: string): Promise<void>;

  /** Create a signed read URL valid for the requested number of seconds. */
  abstract getSignedUrl(key: string, expiresIn: number): Promise<string>;

  /** Open a readable stream for a stored object. */
  abstract getReadStream(key: string): Promise<Readable>;

  /** Return whether an object exists at the given key. */
  abstract exists(key: string): Promise<boolean>;
}
