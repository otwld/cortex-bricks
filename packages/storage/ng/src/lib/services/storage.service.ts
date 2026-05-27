import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, OnDestroy, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { UploadStatus } from '@otwld/ts-storage';
import { StorageClientError, StorageClientErrorCode } from '../exceptions/storage-client-error';
import { UploadGroupImpl } from '../internal/upload-group.impl';
import { removeStoredUpload } from '../internal/local-storage-url-storage';
import { UploadTaskImpl } from '../internal/upload-task.impl';
import { GroupUploadOptions, UploadOptions } from '../models/upload-options';
import { UploadGroup } from '../models/upload-group';
import { UploadTask } from '../models/upload-task';
import { STORAGE_CONFIG } from '../tokens/storage-config.token';
import { getUploadProgress, isMimeTypeAllowed } from '../utils/storage-utils';

/**
 * Provides storage service behavior.
 */
@Injectable({ providedIn: 'root' })
/** Root Angular service for creating upload tasks and requesting signed URLs. */
export class StorageService implements OnDestroy {
  private readonly config = inject(STORAGE_CONFIG);
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly _tasks = signal<Map<string, UploadTaskImpl>>(new Map());
  private readonly _groups = signal<Map<string, UploadGroupImpl>>(new Map());

  /** Signal containing all known upload tasks. */
  readonly tasks = computed<UploadTask[]>(() => Array.from(this._tasks().values()));
  /** Signal containing all known upload groups. */
  readonly groups = computed<UploadGroup[]>(() => Array.from(this._groups().values()));
  /** Signal containing the count of active uploads. */
  readonly activeCount = computed(() => this.tasks().filter((task) => task.status() === UploadStatus.Active).length);
  /** Signal containing average progress across all tasks. */
  readonly totalProgress = computed(() => getUploadProgress(this.tasks()));

  constructor() {
    effect(() => {
      if (!this.isBrowser) return;
      for (const task of this._tasks().values()) {
        if (task.status() === UploadStatus.Completed && task._fingerprint) {
          removeStoredUpload(task._fingerprint);
        }
      }
    });
  }

  /** Create an upload task for a file and optionally auto-start it. */
  /**
   * Runs upload.
   *
   * @param file - file value.
   *
   * @param options - options value.
   *
   * @returns The storage service upload result.
   */
  upload(file: File, options: UploadOptions = {}): UploadTask {
    this.assertBrowser();
    this.validateFile(file, options);
    const task = new UploadTaskImpl(file, options, this.config, {
      onUpdate: () => this.touchTasks(),
      onComplete: () => this.touchTasks(),
      onError: () => this.touchTasks(),
    });
    this._tasks.update((tasks) => new Map(tasks).set(task.id, task));
    if (options.autoStart !== false) task.start();
    return task;
  }

  /** Create upload tasks for multiple files and expose them as a group. */
  /**
   * Runs upload group.
   *
   * @param files - files value.
   *
   * @param options - options value.
   *
   * @returns The storage service upload group result.
   */
  uploadGroup(files: File[], options: GroupUploadOptions = {}): UploadGroup {
    this.assertBrowser();
    const groupId = options.groupId ?? crypto.randomUUID();
    const taskIds = files.map((file) => this.upload(file, options).id);
    const group = new UploadGroupImpl(groupId, () => taskIds.map((id) => this._tasks().get(id)).filter((task): task is UploadTaskImpl => Boolean(task)));
    this._groups.update((groups) => new Map(groups).set(group.id, group));
    return group;
  }

  /** Pause a task by id. */
  /**
   * Runs pause.
   *
   * @param taskId - task id value.
   */
  pause(taskId: string): void {
    this._tasks().get(taskId)?.pause();
  }

  /** Resume a task by id. */
  /**
   * Runs resume.
   *
   * @param taskId - task id value.
   */
  resume(taskId: string): void {
    this._tasks().get(taskId)?.resume();
  }

  /** Cancel a task by id. */
  /**
   * Runs cancel.
   *
   * @param taskId - task id value.
   */
  cancel(taskId: string): void {
    this._tasks().get(taskId)?.cancel();
  }

  /** Abort all tracked uploads when Angular destroys the service. */
  ngOnDestroy(): void {
    for (const task of this._tasks().values()) task.dispose();
  }

  /** Pause all tracked tasks. */
  pauseAll(): void {
    this.tasks().forEach((task) => this.pause(task.id));
  }

  /** Resume all tracked tasks. */
  resumeAll(): void {
    this.tasks().forEach((task) => this.resume(task.id));
  }

  /** Request a signed read URL from the configured endpoint. */
  /**
   * Runs get signed url.
   *
   * @param key - key value.
   *
   * @param expiresIn - expires in value.
   *
   * @returns The storage service get signed url result.
   *
   * @throws When the operation cannot be completed.
   */
  async getSignedUrl(key: string, expiresIn = this.config.defaultExpiresIn): Promise<string> {
    try {
      const response = await firstValueFrom(this.http.post<string | { url: string }>(this.config.signedUrlEndpoint, { key, expiresIn }));
      return typeof response === 'string' ? response : response.url;
    } catch (error) {
      throw new StorageClientError(StorageClientErrorCode.SIGNED_URL_FAILED, 'Failed to fetch signed URL', error);
    }
  }

  private assertBrowser(): void {
    if (!this.isBrowser) {
      throw new StorageClientError(StorageClientErrorCode.NOT_BROWSER, 'Uploads can only be started in a browser');
    }
  }

  private validateFile(file: File, options: UploadOptions): void {
    if (options.accept && !isMimeTypeAllowed(file, options.accept)) {
      throw new StorageClientError(StorageClientErrorCode.INVALID_FILE, `File ${file.name} does not match accept rules`);
    }
    if (options.maxSize && file.size > options.maxSize) {
      throw new StorageClientError(StorageClientErrorCode.INVALID_FILE, `File ${file.name} exceeds maxSize`);
    }
  }

  private touchTasks(): void {
    this._tasks.update((tasks) => new Map(tasks));
  }
}
