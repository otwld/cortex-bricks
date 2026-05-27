import { Inject, Injectable } from '@nestjs/common';
import { StorageDriver as StorageDriverKind } from '@otwld/ts-storage';
import { NormalizedStorageModuleOptions, STORAGE_MODULE_OPTIONS, StorageModuleOptions, validateStorageModuleOptions } from '../config/storage-module-options';
import { verifyFilesystemSignedToken } from '../drivers/filesystem-signed-url';
import { StorageDriver } from '../drivers/storage-driver';
import { StorageException } from '../exceptions/storage.exception';

/** Options controlling signed URL generation. */
export interface SignedUrlOptions {
  /** Time-to-live in seconds for the generated URL. */
  expiresIn?: number;
}

/**
 * Provides signed url service behavior.
 */
@Injectable()
/** Generates signed read URLs and verifies filesystem signed URL tokens. */
export class SignedUrlService {
  private readonly options: NormalizedStorageModuleOptions;

  /**
   * Creates a signed url service instance.
   *
   * @param driver - driver value.
   *
   * @param rawOptions - raw options value.
   */
  constructor(
    private readonly driver: StorageDriver,
    @Inject(STORAGE_MODULE_OPTIONS) private readonly rawOptions: StorageModuleOptions,
  ) {
    this.options = validateStorageModuleOptions(rawOptions);
  }

  /** Create a signed read URL for a driver key. */
  /**
   * Runs generate.
   *
   * @param key - key value.
   *
   * @param options - options value.
   *
   * @returns The signed url service generate result.
   */
  async generate(key: string, options: SignedUrlOptions = {}): Promise<string> {
    const expiresIn = options.expiresIn ?? this.options.filesystem?.signedUrlTtl ?? 3600;
    return this.driver.getSignedUrl(key, expiresIn);
  }

  /** Verify a filesystem signed URL token and return its payload. */
  /**
   * Runs verify.
   *
   * @param token - token value.
   *
   * @returns The signed url service verify result.
   *
   * @throws When the operation cannot be completed.
   */
  async verify(token: string): Promise<{ key: string; exp: number }> {
    if (this.options.driver !== StorageDriverKind.Filesystem || !this.options.filesystem) {
      throw StorageException.misconfigured('Only filesystem signed URL tokens can be verified by this service');
    }
    return verifyFilesystemSignedToken(token, this.options.filesystem.signedUrlSecret);
  }
}
