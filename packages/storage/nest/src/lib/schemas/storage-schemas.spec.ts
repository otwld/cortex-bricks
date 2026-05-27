import { StorageDriver } from '@otwld/ts-storage';
import { StorageFileSchema } from './storage-file.schema';
import { UploadStateSchema } from './upload-state.schema';

describe('storage mongoose schemas', () => {
  it('stores storage driver fields as string enum values', () => {
    expect(StorageFileSchema.path('driver').instance).toBe('String');
    expect(UploadStateSchema.path('driver').instance).toBe('String');

    const storageDriverPath = StorageFileSchema.path('driver');
    const uploadDriverPath = UploadStateSchema.path('driver');

    expect(storageDriverPath.options['enum']).toEqual(StorageDriver);
    expect(uploadDriverPath.options['enum']).toEqual(StorageDriver);
  });
});
