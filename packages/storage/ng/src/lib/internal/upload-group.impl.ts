import { computed } from '@angular/core';
import { GroupStatus, UploadStatus } from '@otwld/ts-storage';
import { UploadGroup } from '../models/upload-group';
import { UploadTask } from '../models/upload-task';
import { getUploadProgress } from '../utils/storage-utils';

export class UploadGroupImpl implements UploadGroup {
  readonly tasks;
  readonly progress;
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

  pause(): void {
    this.tasks().forEach((task) => (task as UploadTask & { pause?: () => void }).pause?.());
  }

  resume(): void {
    this.tasks().forEach((task) => (task as UploadTask & { resume?: () => void }).resume?.());
  }

  cancel(): void {
    this.tasks().forEach((task) => (task as UploadTask & { cancel?: () => void }).cancel?.());
  }
}
