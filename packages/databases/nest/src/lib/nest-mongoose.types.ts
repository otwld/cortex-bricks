import type {
  MongooseModuleFactoryOptions,
  MongooseModuleOptions,
} from '@nestjs/mongoose';
import type { NestFeatureModuleAsyncOptions } from '@otwld/nest-sdk';

/**
 * Connection settings consumed by `NestMongooseModule`.
 *
 * Callers may provide a full `uri` or build one from `hosts`, credentials, and
 * `dbName`. Timeout names use lower-camel Cortex option names and are mapped to
 * the corresponding Mongoose options by the module utilities.
 */
export interface NestMongooseConnectionOptions {
  appName?: string;
  authSource?: string;
  autoIndex?: boolean;
  compressors?: string[];
  connectTimeoutMs?: number;
  dbName?: string;
  directConnection?: boolean;
  heartbeatFrequencyMs?: number;
  hosts?: string[];
  logConnectionEvents?: boolean;
  maxPoolSize?: number;
  minPoolSize?: number;
  password?: string;
  replicaSet?: string;
  retryWrites?: boolean;
  serverSelectionTimeoutMs?: number;
  socketTimeoutMs?: number;
  uri?: string;
  user?: string;
  mongoose?: Omit<
    MongooseModuleOptions,
    | 'appName'
    | 'authSource'
    | 'autoIndex'
    | 'connectTimeoutMS'
    | 'dbName'
    | 'directConnection'
    | 'heartbeatFrequencyMS'
    | 'maxPoolSize'
    | 'minPoolSize'
    | 'pass'
    | 'retryWrites'
    | 'serverSelectionTimeoutMS'
    | 'socketTimeoutMS'
    | 'uri'
    | 'user'
  >;
  connectionFactory?: MongooseModuleFactoryOptions['connectionFactory'];
}

/**
 * Async options accepted by `NestMongooseModule.forRootAsync` and `registerAsync`.
 */
export type NestMongooseAsyncOptions =
  NestFeatureModuleAsyncOptions<NestMongooseConnectionOptions>;
