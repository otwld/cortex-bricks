import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { StorageDriver as StorageDriverKind } from '@otwld/ts-storage';
import {
  ManualStorageModuleAsyncOptions,
  STORAGE_MODULE_OPTIONS,
  StorageModuleOptions,
  StorageModuleOptionsFactory,
  validateStorageModuleOptions,
} from './config/storage-module-options';
import { FilesystemStorageDriver } from './drivers/filesystem.driver';
import { MultipartStorageDriver } from './drivers/multipart-storage-driver';
import { S3StorageDriver } from './drivers/s3.driver';
import { StorageDriver } from './drivers/storage-driver';
import { FilesystemFileController } from './filesystem/filesystem-file.controller';
import { HookRunnerService } from './hooks/hook-runner.service';
import { StorageHook, STORAGE_HOOKS } from './hooks/storage-hook';
import { StorageFileRecord, StorageFileSchema } from './schemas/storage-file.schema';
import { SignedUrlService } from './services/signed-url.service';
import { StorageService } from './services/storage.service';

function createDriverProvider(): Provider {
  return {
    provide: StorageDriver,
    useFactory: async (options: StorageModuleOptions, moduleRef: ModuleRef): Promise<StorageDriver> => {
      const validated = validateStorageModuleOptions(options);
      return validated.driver === StorageDriverKind.S3 ? moduleRef.create(S3StorageDriver) : moduleRef.create(FilesystemStorageDriver);
    },
    inject: [STORAGE_MODULE_OPTIONS, ModuleRef],
  };
}

function createHookProvider(): Provider {
  return {
    provide: STORAGE_HOOKS,
    useFactory: async (options: StorageModuleOptions, moduleRef: ModuleRef): Promise<StorageHook[]> => {
      const validated = validateStorageModuleOptions(options);
      return Promise.all((validated.hooks ?? []).map((hook) => moduleRef.create(hook)));
    },
    inject: [STORAGE_MODULE_OPTIONS, ModuleRef],
  };
}

function createBaseProviders(): Provider[] {
  return [
    createDriverProvider(),
    { provide: MultipartStorageDriver, useExisting: StorageDriver },
    createHookProvider(),
    HookRunnerService,
    StorageService,
    SignedUrlService,
  ];
}

function createAsyncOptionsProvider(asyncOptions: ManualStorageModuleAsyncOptions): Provider {
  const factory = asyncOptions.useFactory;
  if (factory) {
    return {
      provide: STORAGE_MODULE_OPTIONS,
      useFactory: async (...args: never[]) => validateStorageModuleOptions(await factory(...args)),
      inject: (asyncOptions.inject ?? []) as never[],
    };
  }

  const inject = (asyncOptions.useClass ?? asyncOptions.useExisting) as Type<StorageModuleOptionsFactory>;
  return {
    provide: STORAGE_MODULE_OPTIONS,
    useFactory: async (factory: StorageModuleOptionsFactory) => validateStorageModuleOptions(await factory.createStorageOptions()),
    inject: [inject],
  };
}

function createAsyncOptionsClassProvider(asyncOptions: ManualStorageModuleAsyncOptions): Provider[] {
  if (!asyncOptions.useClass) return [];
  return [{ provide: asyncOptions.useClass, useClass: asyncOptions.useClass }];
}

/**
 * Provides storage module behavior.
 */
@Module({})
/** Nest module that wires storage drivers, hooks, services, and filesystem file routes. */
export class StorageModule {
  /** Configure storage with synchronous options. */
  /**
   * Runs for root.
   *
   * @param options - options value.
   *
   * @returns The storage module for root result.
   */
  static forRoot(options: StorageModuleOptions): DynamicModule {
    const validated = validateStorageModuleOptions(options);
    return {
      module: StorageModule,
      global: true,
      imports: [MongooseModule.forFeature([{ name: StorageFileRecord.name, schema: StorageFileSchema }])],
      controllers: validated.driver === StorageDriverKind.Filesystem ? [FilesystemFileController] : [],
      providers: [{ provide: STORAGE_MODULE_OPTIONS, useValue: validated }, ...createBaseProviders()],
      exports: [STORAGE_MODULE_OPTIONS, StorageDriver, MultipartStorageDriver, HookRunnerService, StorageService, SignedUrlService],
    };
  }

  /** Configure storage with an async factory or options factory class. */
  /**
   * Runs for root async.
   *
   * @param asyncOptions - async options value.
   *
   * @returns The storage module for root async result.
   */
  static forRootAsync(asyncOptions: ManualStorageModuleAsyncOptions): DynamicModule {
    return {
      module: StorageModule,
      global: true,
      imports: [...(asyncOptions.imports ?? []), MongooseModule.forFeature([{ name: StorageFileRecord.name, schema: StorageFileSchema }])],
      controllers: asyncOptions.exposeFilesystemController ? [FilesystemFileController] : [],
      providers: [createAsyncOptionsProvider(asyncOptions), ...createAsyncOptionsClassProvider(asyncOptions), ...createBaseProviders()],
      exports: [STORAGE_MODULE_OPTIONS, StorageDriver, MultipartStorageDriver, HookRunnerService, StorageService, SignedUrlService],
    };
  }
}
