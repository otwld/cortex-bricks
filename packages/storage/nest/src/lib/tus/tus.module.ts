import { DynamicModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UploadCleanupService } from '../services/upload-cleanup.service';
import { StorageFileRecord, StorageFileSchema } from '../schemas/storage-file.schema';
import { UploadState, UploadStateSchema } from '../schemas/upload-state.schema';
import { TusController } from './tus.controller';
import { TusService } from './tus.service';
import { TUS_MODULE_OPTIONS, TusModuleOptions } from './tus.tokens';

export { TUS_MODULE_OPTIONS, TusModuleOptions } from './tus.tokens';

/** Default TUS module configuration. */
export const DEFAULT_TUS_MODULE_OPTIONS: TusModuleOptions = {
  path: '/storage/tus',
  maxSize: 10 * 1024 * 1024 * 1024,
  uploadStateTtl: 86400,
  cleanupIntervalMs: 6 * 60 * 60 * 1000,
  allowOrigin: '*',
};

/**
 * Provides tus module behavior.
 */
@Module({})
/** Nest module exposing TUS resumable upload endpoints and services. */
export class TusModule {
  /** Configure TUS endpoints and persistence providers. */
  /**
   * Runs for root.
   *
   * @param options - options value.
   *
   * @returns The tus module for root result.
   */
  static forRoot(options: Partial<TusModuleOptions> = {}): DynamicModule {
    const resolved = { ...DEFAULT_TUS_MODULE_OPTIONS, ...options };
    return {
      module: TusModule,
      imports: [
        MongooseModule.forFeature([
          { name: UploadState.name, schema: UploadStateSchema },
          { name: StorageFileRecord.name, schema: StorageFileSchema },
        ]),
      ],
      controllers: [TusController],
      providers: [
        TusService,
        UploadCleanupService,
        {
          provide: TUS_MODULE_OPTIONS,
          useValue: resolved,
        },
      ],
      exports: [TusService],
    };
  }
}
