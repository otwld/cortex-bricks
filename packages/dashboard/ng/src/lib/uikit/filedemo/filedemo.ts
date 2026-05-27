import { Component, computed, inject, signal } from '@angular/core';
import { UploadStatus } from '@otwld/ts-storage';
import { StorageService, StoBytesPipe, UploadGroup, UploadTask } from '@otwld/ng-storage';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { FileUploadHandlerEvent } from 'primeng/types/fileupload';

type FileUploadMode = 'advanced' | 'basic';

/**
 * Demonstrates PrimeNG advanced and basic file upload modes backed by ng-storage.
 */
@Component({
  selector: 'app-file-demo',
  imports: [FileUploadModule, ToastModule, ButtonModule, ProgressBarModule, TagModule, StoBytesPipe],
  templateUrl: './filedemo.html',
  providers: [MessageService],
})
export class FileDemo {
  private readonly accept = 'image/*';
  private readonly maxFileSize = 1_000_000;

  protected readonly advancedGroup = signal<UploadGroup | null>(null);
  protected readonly basicGroup = signal<UploadGroup | null>(null);
  protected readonly advancedTasks = computed(() => this.advancedGroup()?.tasks() ?? []);
  protected readonly basicTasks = computed(() => this.basicGroup()?.tasks() ?? []);

  private readonly messageService = inject(MessageService);
  private readonly storage = inject(StorageService);

  /**
   * Starts resumable uploads for files selected by PrimeNG's custom upload flow.
   */
  protected uploadWithStorage(event: FileUploadHandlerEvent, mode: FileUploadMode): void {
    const files = [...event.files];
    if (!files.length) return;

    try {
      const group = this.storage.uploadGroup(files, {
        accept: this.accept,
        maxSize: this.maxFileSize,
        metadata: {
          mode,
          source: 'dashboard-filedemo',
        },
      });

      if (mode === 'basic') this.basicGroup.set(group);
      else this.advancedGroup.set(group);

      this.messageService.add({
        severity: 'info',
        summary: 'Upload started',
        detail: `${files.length} file${files.length === 1 ? '' : 's'} queued`,
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Upload failed',
        detail: error instanceof Error ? error.message : 'The selected files could not be uploaded',
      });
    }
  }

  protected statusSeverity(task: UploadTask): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    switch (task.status()) {
      case UploadStatus.Completed:
        return 'success';
      case UploadStatus.Active:
        return 'info';
      case UploadStatus.Paused:
        return 'warn';
      case UploadStatus.Failed:
        return 'danger';
      default:
        return 'secondary';
    }
  }
}
