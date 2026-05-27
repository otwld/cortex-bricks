import { Controller, Get, Inject, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { StorageDriver as StorageDriverKind } from '@otwld/ts-storage';
import { NormalizedStorageModuleOptions, STORAGE_MODULE_OPTIONS, StorageModuleOptions, validateStorageModuleOptions } from '../config/storage-module-options';
import { StorageDriver } from '../drivers/storage-driver';
import { StorageException } from '../exceptions/storage.exception';
import { SignedUrlService } from '../services/signed-url.service';

/**
 * Provides filesystem file controller behavior.
 */
@Controller('storage/files')
/** Serves filesystem-backed files through signed URL tokens. */
export class FilesystemFileController {
  private readonly options: NormalizedStorageModuleOptions;

  /**
   * Creates a filesystem file controller instance.
   *
   * @param signedUrl - signed url value.
   *
   * @param driver - driver value.
   *
   * @param rawOptions - raw options value.
   */
  constructor(
    private readonly signedUrl: SignedUrlService,
    private readonly driver: StorageDriver,
    @Inject(STORAGE_MODULE_OPTIONS) private readonly rawOptions: StorageModuleOptions,
  ) {
    this.options = validateStorageModuleOptions(rawOptions);
  }

  /**
   * Runs serve.
   *
   * @param token - token value.
   *
   * @param response - response value.
   *
   * @throws When the operation cannot be completed.
   */
  @Get(':token')
  /** Verify a signed token and pipe the referenced file to the response. */
  async serve(@Param('token') token: string, @Res() response: Response): Promise<void> {
    if (this.options.driver !== StorageDriverKind.Filesystem) {
      throw StorageException.misconfigured('Filesystem signed URL endpoint requires the filesystem driver');
    }
    const { key } = await this.signedUrl.verify(token);
    const stream = await this.driver.getReadStream(key);
    stream.pipe(response);
  }
}
