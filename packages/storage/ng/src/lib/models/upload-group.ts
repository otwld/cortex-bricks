import { Signal } from '@angular/core';
import { GroupStatus } from '@otwld/ts-storage';
import { UploadTask } from './upload-task';

/** Read-only aggregate view over a group of upload tasks. */
export interface UploadGroup {
  /** Stable group id. */
  readonly id: string;
  /** Signal containing tasks in the group. */
  readonly tasks: Signal<UploadTask[]>;
  /** Signal containing aggregate group status. */
  readonly status: Signal<GroupStatus>;
  /** Signal containing average group progress. */
  readonly progress: Signal<number>;
  /** Pause all tasks in the group. */
  pause(): void;
  /** Resume all tasks in the group. */
  resume(): void;
  /** Cancel all tasks in the group. */
  cancel(): void;
}
