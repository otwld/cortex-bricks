import { ConfigurableModuleBuilder } from '@nestjs/common';
import type { StorageModuleOptions } from './storage-module-options';

/** Generated configurable-module artifacts for storage module options. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } = new ConfigurableModuleBuilder<StorageModuleOptions>()
  .setClassMethodName('forRoot')
  .setFactoryMethodName('createStorageOptions')
  .build();
