import { ConfigurableModuleBuilder } from '@nestjs/common';
import type { AiModuleOptions } from './ai-module-options';

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
