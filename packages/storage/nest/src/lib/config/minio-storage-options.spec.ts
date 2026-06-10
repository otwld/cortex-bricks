import { ConfigService } from '@nestjs/config';
import { StorageDriver } from '@otwld/ts-storage';

import { getStorageS3OptionsFromMinioConfig } from './minio-storage-options';

describe(getStorageS3OptionsFromMinioConfig.name, () => {
  it('reads the default MinIO env shape into S3 storage options', () => {
    const configService = new ConfigService({
      MINIO_ACCESS_KEY: 'access-key',
      MINIO_BUCKET: 'bucket-name',
      MINIO_ENDPOINT: 'minio.ntrehout.svc.cluster.local',
      MINIO_PORT: '9000',
      MINIO_SECRET_KEY: 'secret-key',
      MINIO_USE_SSL: 'false',
    });

    expect(getStorageS3OptionsFromMinioConfig(configService)).toEqual({
      driver: StorageDriver.S3,
      s3: {
        accessKeyId: 'access-key',
        bucket: 'bucket-name',
        endpoint: 'http://minio.ntrehout.svc.cluster.local:9000',
        forcePathStyle: true,
        region: 'us-east-1',
        secretAccessKey: 'secret-key',
        signedUrlMaxTtl: undefined,
      },
    });
  });

  it('rejects URL-shaped endpoints because the scheme is configured separately', () => {
    const configService = new ConfigService({
      MINIO_ACCESS_KEY: 'access-key',
      MINIO_BUCKET: 'bucket-name',
      MINIO_ENDPOINT: 'http://minio.ntrehout.svc.cluster.local',
      MINIO_SECRET_KEY: 'secret-key',
      MINIO_USE_SSL: 'false',
    });

    expect(() => getStorageS3OptionsFromMinioConfig(configService)).toThrow(
      'MINIO_ENDPOINT must contain only the host name',
    );
  });

  it('supports custom key names and HTTPS endpoints', () => {
    const configService = new ConfigService({
      OBJECT_ACCESS_KEY: 'access-key',
      OBJECT_BUCKET: 'bucket-name',
      OBJECT_ENDPOINT: 'minio.example.com',
      OBJECT_REGION: 'eu-west-1',
      OBJECT_SECRET_KEY: 'secret-key',
      OBJECT_USE_SSL: 'true',
    });

    expect(
      getStorageS3OptionsFromMinioConfig(configService, {
        accessKeyKey: 'OBJECT_ACCESS_KEY',
        bucketKey: 'OBJECT_BUCKET',
        endpointKey: 'OBJECT_ENDPOINT',
        regionKey: 'OBJECT_REGION',
        secretKeyKey: 'OBJECT_SECRET_KEY',
        signedUrlMaxTtl: 60,
        useSslKey: 'OBJECT_USE_SSL',
      }),
    ).toMatchObject({
      s3: {
        endpoint: 'https://minio.example.com',
        region: 'eu-west-1',
        signedUrlMaxTtl: 60,
      },
    });
  });
});
