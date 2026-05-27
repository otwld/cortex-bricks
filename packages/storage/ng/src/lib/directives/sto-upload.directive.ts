import { Directive, effect, EffectRef, inject, Injector, input, output } from '@angular/core';
import { StorageFile, UploadStatus } from '@otwld/ts-storage';
import { UploadErrorEvent } from '../models/upload-error-event';
import { UploadOptions } from '../models/upload-options';
import { UploadTask } from '../models/upload-task';
import { StorageService } from '../services/storage.service';

/**
 * Provides sto upload directive behavior.
 */
@Directive({
  selector: '[stoUpload]',
  host: { '(change)': 'onFileChange($event)' },
})
/** File input directive that creates uploads and emits task lifecycle events. */
export class StoUploadDirective {
  /** Upload options read from the `stoUpload` input. */
  readonly options = input<UploadOptions>({}, { alias: 'stoUpload' });
  /** Emits when an upload task is created. */
  readonly uploadStart = output<UploadTask>();
  /** Emits when an upload completes and returns a storage file. */
  readonly uploadComplete = output<StorageFile>();
  /** Emits when an upload task fails. */
  readonly uploadError = output<UploadErrorEvent>();

  private readonly storage = inject(StorageService);
  private readonly injector = inject(Injector);

  /** Handle native file input changes and create upload tasks. */
  /**
   * Runs on file change.
   *
   * @param event - event value.
   */
  onFileChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const files = Array.from(inputElement.files ?? []);
    for (const file of files) {
      const task = this.storage.upload(file, this.options());
      this.uploadStart.emit(task);
      const terminalEffect: { ref?: EffectRef } = {};
      terminalEffect.ref = effect(
        () => {
          const status = task.status();
          const storageFile = task.storageFile();
          const error = task.error();
          if (status === UploadStatus.Completed && storageFile) {
            this.uploadComplete.emit(storageFile);
            terminalEffect.ref?.destroy();
            return;
          }
          if (status === UploadStatus.Failed && error) {
            this.uploadError.emit({
              task,
              error,
              retryable: false,
              attempt: task.retryAttempt(),
            });
            terminalEffect.ref?.destroy();
          }
        },
        { injector: this.injector },
      );
    }
  }
}
