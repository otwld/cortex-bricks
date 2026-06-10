import { DynamicModule, Module } from '@nestjs/common';
import {
  MongooseModule,
  type MongooseModuleFactoryOptions,
} from '@nestjs/mongoose';
import { collectNestFeatureModuleImports } from '@otwld/nest-sdk';

import type {
  NestMongooseAsyncOptions,
  NestMongooseConnectionOptions,
} from './nest-mongoose.types';
import { createNestMongooseModuleOptions } from './nest-mongoose.utils';

/**
 * Opinionated Nest wrapper around `MongooseModule.forRootAsync`.
 *
 * The module accepts source-brick connection options, normalizes them through
 * the shared utility helpers, and exposes both Nest-style `forRoot` names and
 * Cortex `register` aliases for feature-module consistency.
 */
@Module({})
export class NestMongooseModule {
  /**
   * Registers a synchronous MongoDB connection configuration.
   */
  static forRoot(options: NestMongooseConnectionOptions): DynamicModule {
    return {
      module: NestMongooseModule,
      imports: [
        MongooseModule.forRootAsync({
          useFactory: (): MongooseModuleFactoryOptions =>
            createNestMongooseModuleOptions(options),
        }),
      ],
    };
  }

  /**
   * Registers an async MongoDB connection configuration factory.
   */
  static forRootAsync(options: NestMongooseAsyncOptions): DynamicModule {
    return {
      module: NestMongooseModule,
      imports: [
        MongooseModule.forRootAsync({
          imports: collectNestFeatureModuleImports(options),
          inject: options.inject,
          useFactory: async (
            ...args: unknown[]
          ): Promise<MongooseModuleFactoryOptions> => {
            const resolvedOptions = await options.useFactory(...args);
            return createNestMongooseModuleOptions(resolvedOptions);
          },
        }),
      ],
    };
  }

  /**
   * Alias for `forRoot` used by Cortex feature-module registration patterns.
   */
  static register(options: NestMongooseConnectionOptions): DynamicModule {
    return NestMongooseModule.forRoot(options);
  }

  /**
   * Alias for `forRootAsync` used by Cortex feature-module registration patterns.
   */
  static registerAsync(options: NestMongooseAsyncOptions): DynamicModule {
    return NestMongooseModule.forRootAsync(options);
  }
}
