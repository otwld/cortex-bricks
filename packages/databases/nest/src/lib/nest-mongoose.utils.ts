import { Logger } from '@nestjs/common';
import type { MongooseModuleFactoryOptions } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';

import type { NestMongooseConnectionOptions } from './nest-mongoose.types';

const DEFAULT_CONNECT_TIMEOUT_MS = 10_000;
const DEFAULT_HEARTBEAT_FREQUENCY_MS = 10_000;
const DEFAULT_MAX_POOL_SIZE = 20;
const DEFAULT_MIN_POOL_SIZE = 1;
const DEFAULT_SERVER_SELECTION_TIMEOUT_MS = 5_000;
const DEFAULT_SOCKET_TIMEOUT_MS = 45_000;

export function buildNestMongooseUri(
  options: NestMongooseConnectionOptions,
): string {
  if (options.uri?.trim()) {
    return options.uri.trim();
  }

  const hosts = options.hosts?.map((host) => host.trim()).filter(Boolean) ?? [];
  if (!hosts.length) {
    throw new Error(
      'MongoDB connection requires either `uri` or at least one entry in `hosts`.',
    );
  }

  if (options.user && !options.password) {
    throw new Error('MongoDB connection received `user` without `password`.');
  }

  if (!options.dbName?.trim()) {
    throw new Error(
      'MongoDB connection requires `dbName` when building the URI from component options.',
    );
  }

  const credentials = options.user
    ? `${encodeURIComponent(options.user)}:${encodeURIComponent(
        options.password ?? '',
      )}@`
    : '';

  const query = new URLSearchParams();

  if (options.replicaSet?.trim()) {
    query.set('replicaSet', options.replicaSet.trim());
  }

  if (options.authSource?.trim()) {
    query.set('authSource', options.authSource.trim());
  }

  if (options.retryWrites != null) {
    query.set('retryWrites', String(options.retryWrites));
  }

  if (options.directConnection != null) {
    query.set('directConnection', String(options.directConnection));
  }

  if (options.compressors?.length) {
    query.set('compressors', options.compressors.join(','));
  }

  const queryString = query.toString();
  return `mongodb://${credentials}${hosts.join(',')}/${encodeURIComponent(
    options.dbName.trim(),
  )}${queryString ? `?${queryString}` : ''}`;
}

export function createNestMongooseModuleOptions(
  options: NestMongooseConnectionOptions,
): MongooseModuleFactoryOptions {
  const logger = new Logger('NestMongooseModule');
  const connectionFactory = options.connectionFactory;
  const logConnectionEvents = options.logConnectionEvents ?? true;

  return {
    appName: options.appName,
    authSource: options.authSource,
    autoIndex: options.autoIndex ?? false,
    connectTimeoutMS: options.connectTimeoutMs ?? DEFAULT_CONNECT_TIMEOUT_MS,
    dbName: options.dbName,
    directConnection: options.directConnection,
    heartbeatFrequencyMS:
      options.heartbeatFrequencyMs ?? DEFAULT_HEARTBEAT_FREQUENCY_MS,
    maxPoolSize: options.maxPoolSize ?? DEFAULT_MAX_POOL_SIZE,
    minPoolSize: options.minPoolSize ?? DEFAULT_MIN_POOL_SIZE,
    retryWrites: options.retryWrites ?? true,
    serverSelectionTimeoutMS:
      options.serverSelectionTimeoutMs ?? DEFAULT_SERVER_SELECTION_TIMEOUT_MS,
    socketTimeoutMS: options.socketTimeoutMs ?? DEFAULT_SOCKET_TIMEOUT_MS,
    uri: buildNestMongooseUri(options),
    user: options.user,
    pass: options.password,
    ...options.mongoose,
    connectionFactory: (
      connection: Connection,
      connectionName: string,
    ): Connection => {
      if (logConnectionEvents) {
        bindConnectionLogging(connection, connectionName, logger);
      }

      return connectionFactory
        ? (connectionFactory(connection, connectionName) as Connection)
        : connection;
    },
  };
}

function bindConnectionLogging(
  connection: Connection,
  connectionName: string,
  logger: Logger,
): void {
  const connectionLabel = connectionName || 'default';

  connection.on('connected', () => {
    logger.log(`MongoDB connection "${connectionLabel}" established.`);
  });

  connection.on('reconnected', () => {
    logger.log(`MongoDB connection "${connectionLabel}" reconnected.`);
  });

  connection.on('disconnected', () => {
    logger.warn(`MongoDB connection "${connectionLabel}" disconnected.`);
  });

  connection.on('error', (error: Error) => {
    logger.error(
      `MongoDB connection "${connectionLabel}" error: ${error.message}`,
    );
  });
}
