import { UploadMeta } from '@otwld/ts-storage';
import { StorageFileRecord } from '../schemas/storage-file.schema';

/** Persisted file record shape exposed to storage lifecycle hooks. */
export type StorageHookFile = StorageFileRecord & {
  /** Mongoose virtual id when the hook receives a hydrated document. */
  id?: string;
  /** Persist hook-side mutations when the underlying record supports it. */
  save(): Promise<unknown>;
};

/** Lifecycle hook base class for upload and delete policy extensions. */
export abstract class StorageHook {
  /** Called before an upload is accepted. Throw to reject the upload. */
  beforeUpload?(meta: UploadMeta): Promise<void>;

  /** Called after an upload record is persisted. */
  afterUpload?(file: StorageHookFile): Promise<void>;

  /** Called before a file is soft- or hard-deleted. Throw to reject deletion. */
  beforeDelete?(file: StorageHookFile): Promise<void>;

  /** Called after a file delete operation completes. */
  afterDelete?(file: StorageHookFile): Promise<void>;
}

/** Injection token used to register storage lifecycle hooks. */
export const STORAGE_HOOKS = Symbol('STORAGE_HOOKS');
