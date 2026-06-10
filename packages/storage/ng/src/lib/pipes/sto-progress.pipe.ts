import { Pipe, PipeTransform } from '@angular/core';
import { UploadTask } from '../models/upload-task';

/** Angular pipe that formats numeric or task progress as a percentage. */
@Pipe({ name: 'stoProgress' })
export class StoProgressPipe implements PipeTransform {
  /** Formats progress from a number or `UploadTask.progress()` signal. */
  transform(value: number | UploadTask): string {
    const progress = typeof value === 'number' ? value : value.progress();
    return `${Math.round(progress)}%`;
  }
}
