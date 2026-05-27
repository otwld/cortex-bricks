import { signal } from '@angular/core';
import { UploadStatus } from '@otwld/ts-storage';
import { UploadTask } from '../models/upload-task';
import { StoProgressPipe } from './sto-progress.pipe';

describe('StoProgressPipe', () => {
  const pipe = new StoProgressPipe();

  it('formats numeric progress', () => expect(pipe.transform(42)).toBe('42%'));

  it('reads task.progress() when given a task', () => {
    const task = {
      id: 'upload-1',
      file: new File(['data'], 'upload.txt'),
      status: signal(UploadStatus.Active),
      progress: signal(72),
      bytesUploaded: signal(72),
      error: signal(null),
      storageFile: signal(null),
      retryAttempt: signal(0),
      nextRetryIn: signal(0),
    } satisfies UploadTask;
    expect(pipe.transform(task)).toBe('72%');
  });
});
