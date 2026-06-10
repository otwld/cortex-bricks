import {
  buildNestMongooseUri,
  createNestMongooseModuleOptions,
} from './nest-mongoose.utils';

describe(buildNestMongooseUri.name, () => {
  it('returns a trimmed full URI when provided', () => {
    expect(
      buildNestMongooseUri({
        uri: ' mongodb://localhost:27017/source ',
      }),
    ).toBe('mongodb://localhost:27017/source');
  });

  it('builds a component URI with credentials and options', () => {
    expect(
      buildNestMongooseUri({
        hosts: ['mongo-a:27017', ' mongo-b:27017 '],
        dbName: 'otwld',
        user: 'service user',
        password: 'secret!',
        replicaSet: 'rs0',
        authSource: 'admin',
        retryWrites: false,
        directConnection: true,
        compressors: ['zstd', 'snappy'],
      }),
    ).toBe(
      'mongodb://service%20user:secret!@mongo-a:27017,mongo-b:27017/otwld?replicaSet=rs0&authSource=admin&retryWrites=false&directConnection=true&compressors=zstd%2Csnappy',
    );
  });

  it('requires hosts and a database name when no URI is provided', () => {
    expect(() => buildNestMongooseUri({ dbName: 'otwld' })).toThrow(
      /requires either `uri`/,
    );
    expect(() => buildNestMongooseUri({ hosts: ['localhost:27017'] })).toThrow(
      /requires `dbName`/,
    );
  });
});

describe(createNestMongooseModuleOptions.name, () => {
  it('applies production-oriented connection defaults', () => {
    const options = createNestMongooseModuleOptions({
      uri: 'mongodb://localhost:27017/otwld',
    });

    expect(options.autoIndex).toBe(false);
    expect(options.connectTimeoutMS).toBe(10_000);
    expect(options.heartbeatFrequencyMS).toBe(10_000);
    expect(options.maxPoolSize).toBe(20);
    expect(options.minPoolSize).toBe(1);
    expect(options.retryWrites).toBe(true);
    expect(options.serverSelectionTimeoutMS).toBe(5_000);
    expect(options.socketTimeoutMS).toBe(45_000);
  });
});
