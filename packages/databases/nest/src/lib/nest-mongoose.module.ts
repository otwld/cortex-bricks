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

@Module({})
export class NestMongooseModule {
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

  static register(options: NestMongooseConnectionOptions): DynamicModule {
    return NestMongooseModule.forRoot(options);
  }

  static registerAsync(options: NestMongooseAsyncOptions): DynamicModule {
    return NestMongooseModule.forRootAsync(options);
  }
}
