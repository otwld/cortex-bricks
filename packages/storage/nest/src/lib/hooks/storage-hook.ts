import { UploadMeta } from '@otwld/ts-storage';
import { StorageFileDocument } from '../schemas/storage-file.schema';

/** Lifecycle hook base class for upload and delete policy extensions. */
export abstract class StorageHook {
  /** Called before an upload is accepted. Throw to reject the upload. */
  /**
   * Runs before upload.
   *
   * @param meta - meta value.
   */
  beforeUpload?(meta: UploadMeta): Promise<void>;
  /** Called after an upload record is persisted. */
  /**
   * Runs after upload.
   *
   * @param file - file value.
   */
  afterUpload?(file: StorageFileDocument): Promise<void>;
  /** Called before a file is soft- or hard-deleted. Throw to reject deletion. */
  /**
   * Runs before delete.
   *
   * @param file - file value.
   */
  beforeDelete?(file: StorageFileDocument): Promise<void>;
  /** Called after a file delete operation completes. */
  /**
   * Runs after delete.
   *
   * @param file - file value.
   */
  afterDelete?(file: StorageFileDocument): Promise<void>;
}

/** Injection token used to register storage lifecycle hooks. */
export const STORAGE_HOOKS = Symbol('STORAGE_HOOKS');
