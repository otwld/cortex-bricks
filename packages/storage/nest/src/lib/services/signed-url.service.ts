import { Injectable } from '@nestjs/common';
import { StorageDriver } from '../drivers/storage-driver';

/** Options controlling signed URL generation. */
export interface SignedUrlOptions {
  /** Time-to-live in seconds for the generated URL. */
  expiresIn?: number;
}

/** Generates signed read URLs and verifies filesystem signed URL tokens. */
@Injectable()
export class SignedUrlService {
  /**
   * Create the signed URL service.
   *
   * @param driver - Active storage driver used to produce signed read URLs.
   */
  constructor(private readonly driver: StorageDriver) {}

  /** Create a signed read URL for a driver key. */
  async generate(key: string, options: SignedUrlOptions = {}): Promise<string> {
    return this.driver.getSignedUrl(key, options.expiresIn);
  }
}
