import { ConfigurableModuleBuilder } from '@nestjs/common';
import type { WebsocketModuleOptions } from './websocket-module-options';

/**
 * Configurable module definition for `WebsocketModule`.
 */
export const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN: WEBSOCKET_MODULE_OPTIONS,
  ASYNC_OPTIONS_TYPE,
  OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<WebsocketModuleOptions>().setClassMethodName('forRoot').build();
