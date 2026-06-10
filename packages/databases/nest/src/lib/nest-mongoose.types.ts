import type {
  MongooseModuleFactoryOptions,
  MongooseModuleOptions,
} from '@nestjs/mongoose';
import type { NestFeatureModuleAsyncOptions } from '@otwld/nest-sdk';

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

export type NestMongooseAsyncOptions =
  NestFeatureModuleAsyncOptions<NestMongooseConnectionOptions>;
