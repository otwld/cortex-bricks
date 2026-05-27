import { StorageDriver } from '@otwld/ts-storage';
import { validateStorageModuleOptions } from './storage-module-options';

describe(validateStorageModuleOptions.name, () => {
  it('applies filesystem defaults after validating required fields', () => {
    const options = validateStorageModuleOptions({
      driver: StorageDriver.Filesystem,
      filesystem: {
        rootPath: '/tmp/uploads',
        signedUrlSecret: 'a'.repeat(32),
      },
    });

    expect(options.filesystem).toEqual({
      rootPath: '/tmp/uploads',
      signedUrlSecret: 'a'.repeat(32),
      signedUrlTtl: 3600,
      publicPath: '/storage/files',
    });
  });

  it('throws a clear misconfiguration error when the selected driver is missing options', () => {
    expect(() => validateStorageModuleOptions({ driver: StorageDriver.S3 })).toThrow(/Storage module configuration is invalid/);
  });

  it('rejects filesystem secret shorter than 32 chars', () => {
    expect(() =>
      validateStorageModuleOptions({
        driver: StorageDriver.Filesystem,
        filesystem: { rootPath: '/tmp', signedUrlSecret: 'short' },
      }),
    ).toThrow(/at least 32/);
  });

  it('accepts filesystem secret of 32 chars', () => {
    expect(() =>
      validateStorageModuleOptions({
        driver: StorageDriver.Filesystem,
        filesystem: { rootPath: '/tmp', signedUrlSecret: 'a'.repeat(32) },
      }),
    ).not.toThrow();
  });
});
