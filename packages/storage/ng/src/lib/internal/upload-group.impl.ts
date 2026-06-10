import { computed } from '@angular/core';
import { GroupStatus, UploadStatus } from '@otwld/ts-storage';
import { UploadGroup } from '../models/upload-group';
import { UploadTask } from '../models/upload-task';
import { getUploadProgress } from '../utils/storage-utils';

/**
 * Signal-backed aggregate view over a set of upload tasks.
 *
 * The group delegates pause, resume, and cancel operations to tasks that expose
 * those optional controls and derives progress/status from the current task
 * collection.
 */
export class UploadGroupImpl implements UploadGroup {
  /**
   * Current upload tasks that belong to this group.
   */
  readonly tasks;

  /**
   * Aggregate upload progress across all tasks in the group.
   */
  readonly progress;

  /**
   * Aggregate group status derived from the current task statuses.
   */
  readonly status;

  constructor(
    readonly id: string,
    private readonly getTasks: () => UploadTask[],
  ) {
    this.tasks = computed(() => this.getTasks());
    this.progress = computed(() => getUploadProgress(this.tasks()));
    this.status = computed<GroupStatus>(() => {
      const tasks = this.tasks();
      if (!tasks.length) return 'pending';
      if (tasks.every((task) => task.status() === UploadStatus.Completed)) return 'completed';
      if (tasks.some((task) => task.status() === UploadStatus.Failed)) return 'failed';
      if (tasks.some((task) => task.status() === UploadStatus.Active)) return 'active';
      if (tasks.some((task) => task.status() === UploadStatus.Completed)) return 'partial';
      return 'pending';
    });
  }

  /**
   * Pauses every task in the group that exposes a pause control.
   */
  pause(): void {
    this.tasks().forEach((task) => (task as UploadTask & { pause?: () => void }).pause?.());
  }

  /**
   * Resumes every task in the group that exposes a resume control.
   */
  resume(): void {
    this.tasks().forEach((task) => (task as UploadTask & { resume?: () => void }).resume?.());
  }

  /**
   * Cancels every task in the group that exposes a cancel control.
   */
  cancel(): void {
    this.tasks().forEach((task) => (task as UploadTask & { cancel?: () => void }).cancel?.());
  }
}
