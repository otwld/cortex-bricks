import { Inject, Injectable, Optional } from '@nestjs/common';
import { UploadMeta } from '@otwld/ts-storage';
import { StorageException } from '../exceptions/storage.exception';
import { StorageHook, StorageHookFile, STORAGE_HOOKS } from './storage-hook';

/** Executes registered storage hooks for a specific lifecycle phase. */
@Injectable()
export class HookRunnerService {
  /**
   * Create a hook runner from registered hook instances.
   *
   * @param hooks - Hook instances collected from the storage hook provider.
   */
  constructor(@Optional() @Inject(STORAGE_HOOKS) private readonly hooks: StorageHook[] = []) {}

  /** Execute `beforeUpload` hooks in registration order. */
  async runBeforeUpload(meta: UploadMeta): Promise<void> {
    await this.runHooks((hook) => hook.beforeUpload?.(meta));
  }

  /** Execute `afterUpload` hooks in registration order. */
  async runAfterUpload(file: StorageHookFile): Promise<void> {
    await this.runHooks((hook) => hook.afterUpload?.(file));
  }

  /** Execute `beforeDelete` hooks in registration order. */
  async runBeforeDelete(file: StorageHookFile): Promise<void> {
    await this.runHooks((hook) => hook.beforeDelete?.(file));
  }

  /** Execute `afterDelete` hooks in registration order. */
  async runAfterDelete(file: StorageHookFile): Promise<void> {
    await this.runHooks((hook) => hook.afterDelete?.(file));
  }

  private async runHooks(invoke: (hook: StorageHook) => Promise<void> | undefined): Promise<void> {
    for (const hook of this.hooks) {
      try {
        await invoke(hook);
      } catch (error) {
        if (error instanceof StorageException) throw error;
        throw StorageException.hookRejected((error as Error)?.message ?? 'Hook rejected', error);
      }
    }
  }
}
