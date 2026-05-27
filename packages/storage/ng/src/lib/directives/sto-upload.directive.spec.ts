import { Component, PLATFORM_ID, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { StorageDriver, StorageFile, UploadStatus } from '@otwld/ts-storage';
import { vi } from 'vitest';
import { UploadTask } from '../models/upload-task';
import { provideStorage } from '../provide-storage';
import { StorageService } from '../services/storage.service';
import { StoUploadDirective } from './sto-upload.directive';

@Component({
  template: `<input type="file" [stoUpload]="{ autoStart: false }" (uploadStart)="started.set(true)" />`,
  imports: [StoUploadDirective],
})
class HostComponent {
  started = signal(false);
}

@Component({
  template: `
    <input
      type="file"
      [stoUpload]="{ autoStart: false }"
      (uploadComplete)="completeCount.set(completeCount() + 1)"
      (uploadError)="errorCount.set(errorCount() + 1)"
    />
  `,
  imports: [StoUploadDirective],
})
class CompletionHostComponent {
  completeCount = signal(0);
  errorCount = signal(0);
}

describe('StoUploadDirective', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideStorage({ tusEndpoint: '/x', signedUrlEndpoint: '/y' }),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }),
  );

  it('starts an upload when files are selected', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [new File([new Uint8Array([1])], 'a.bin')] });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(fixture.componentInstance.started()).toBe(true);
  });

  it('stops observing a task after a completed upload emits', () => {
    const controlled = createControllableTask();
    const storage = { upload: vi.fn().mockReturnValue(controlled.task) } as unknown as StorageService;
    TestBed.overrideProvider(StorageService, { useValue: storage });
    const fixture = TestBed.createComponent(CompletionHostComponent);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    Object.defineProperty(input, 'files', { configurable: true, value: [controlled.task.file] });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    controlled.complete(storageFile());
    fixture.detectChanges();
    controlled.fail(new Error('late failure'));
    fixture.detectChanges();

    expect(fixture.componentInstance.completeCount()).toBe(1);
    expect(fixture.componentInstance.errorCount()).toBe(0);
  });
});

function createControllableTask() {
  const file = new File([new Uint8Array([1])], 'a.bin');
  const status = signal(UploadStatus.Pending);
  const progress = signal(0);
  const bytesUploaded = signal(0);
  const error = signal<Error | null>(null);
  const storedFile = signal<StorageFile | null>(null);
  const retryAttempt = signal(0);
  const nextRetryIn = signal(0);
  const task: UploadTask = {
    id: 'task-1',
    file,
    status: status.asReadonly(),
    progress: progress.asReadonly(),
    bytesUploaded: bytesUploaded.asReadonly(),
    error: error.asReadonly(),
    storageFile: storedFile.asReadonly(),
    retryAttempt: retryAttempt.asReadonly(),
    nextRetryIn: nextRetryIn.asReadonly(),
  };

  return {
    task,
    complete(value: StorageFile) {
      storedFile.set(value);
      status.set(UploadStatus.Completed);
    },
    fail(value: Error) {
      error.set(value);
      status.set(UploadStatus.Failed);
    },
  };
}

function storageFile(): StorageFile {
  return {
    id: 'file-1',
    key: 'uploads/a.bin',
    filename: 'a.bin',
    mimetype: 'application/octet-stream',
    size: 1,
    driver: StorageDriver.S3,
    checksum: 'checksum',
    createdAt: new Date('2026-05-08T00:00:00.000Z'),
    updatedAt: new Date('2026-05-08T00:00:00.000Z'),
  };
}
