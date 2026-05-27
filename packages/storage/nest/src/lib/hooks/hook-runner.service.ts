import { Inject, Injectable, Optional } from '@nestjs/common';
import { StorageException } from '../exceptions/storage.exception';
import { StorageHook, STORAGE_HOOKS } from './storage-hook';

/**
 * Provides hook runner service behavior.
 */
@Injectable()
/** Runs registered storage hooks for a specific lifecycle phase. */
export class HookRunnerService {
  /** Create a hook runner from registered hook instances. */
  /**
   * Creates a hook runner service instance.
   *
   * @param hooks - hooks value.
   */
  constructor(@Optional() @Inject(STORAGE_HOOKS) private readonly hooks: StorageHook[] = []) {}

  /** Execute all hooks for a phase, preserving hook order and wrapping generic errors. */
  /**
   * Runs run.
   *
   * @param phase - phase value.
   *
   * @param arg - arg value.
   *
   * @throws When the operation cannot be completed.
   */
  async run<K extends keyof StorageHook>(phase: K, arg: Parameters<NonNullable<StorageHook[K]>>[0]): Promise<void> {
    for (const hook of this.hooks) {
      try {
        await hook[phase]?.(arg as never);
      } catch (error) {
        if (error instanceof StorageException) throw error;
        throw StorageException.hookRejected((error as Error)?.message ?? 'Hook rejected', error);
      }
    }
  }
}
