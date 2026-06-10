import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MultipartStorageDriver } from '../drivers/multipart-storage-driver';
import { UploadState } from '../schemas/upload-state.schema';
import { TUS_MODULE_OPTIONS, TusModuleOptions } from '../tus/tus.tokens';

/** Periodically aborts expired multipart uploads and removes their state records. */
@Injectable()
export class UploadCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UploadCleanupService.name);
  private timer?: NodeJS.Timeout;

  /**
   * Create the expired-upload cleanup service.
   *
   * @param driver - Multipart driver used to abort staged uploads.
   * @param uploadStateModel - Mongoose model for resumable upload state records.
   * @param options - TUS module timing options.
   */
  constructor(
    private readonly driver: MultipartStorageDriver,
    @InjectModel(UploadState.name) private readonly uploadStateModel: Model<UploadState>,
    @Inject(TUS_MODULE_OPTIONS) private readonly options: TusModuleOptions,
  ) {}

  /** Start the periodic cleanup timer. */
  onModuleInit(): void {
    this.timer = setInterval(() => void this.sweep(), this.options.cleanupIntervalMs);
  }

  /** Stop the periodic cleanup timer. */
  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  /** Sweep expired upload state records and abort their staged multipart data. */
  async sweep(): Promise<void> {
    const expired = await this.uploadStateModel.find({ expiresAt: { $lte: new Date() } }).exec();
    for (const upload of expired) {
      try {
        await this.driver.abortMultipartUpload(upload.uploadId, upload.key);
        await this.uploadStateModel.deleteOne({ uploadId: upload.uploadId }).exec();
      } catch (error) {
        this.logger.warn(`Failed to clean up expired upload ${upload.uploadId}: ${(error as Error).message}`);
      }
    }
  }
}
