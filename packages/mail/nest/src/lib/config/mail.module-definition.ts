import { ConfigurableModuleBuilder } from '@nestjs/common';
import type { MailModuleOptions } from './mail-module-options';

export const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
  OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<MailModuleOptions>()
  .setClassMethodName('forRoot')
  .setFactoryMethodName('createMailOptions')
  .setExtras({ isGlobal: true }, (definition, extras) => ({
    ...definition,
    global: extras.isGlobal,
  }))
  .build();
