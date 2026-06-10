import { ConfigurableModuleBuilder } from '@nestjs/common';
import type { AiModuleOptions } from './ai-module-options';

/**
 * Configurable Nest module artifacts for the AI module.
 *
 * The generated module uses `forRoot` and `createAiOptions` so sync and async
 * registration match the public AI module configuration API.
 */
export const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
  OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<AiModuleOptions>()
  .setClassMethodName('forRoot')
  .setFactoryMethodName('createAiOptions')
  .setExtras({ isGlobal: true }, (definition, extras) => ({
    ...definition,
    global: extras.isGlobal,
  }))
  .build();
