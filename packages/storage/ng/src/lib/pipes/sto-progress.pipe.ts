import { Pipe, PipeTransform } from '@angular/core';
import { UploadTask } from '../models/upload-task';

/**
 * Provides sto progress pipe behavior.
 */
@Pipe({ name: 'stoProgress' })
/** Angular pipe that formats numeric or task progress as a percentage. */
export class StoProgressPipe implements PipeTransform {
  /** Format progress from a number or `UploadTask.progress()` signal. */
  /**
   * Runs transform.
   *
   * @param value - value value.
   *
   * @returns The sto progress pipe transform result.
   */
  transform(value: number | UploadTask): string {
    const progress = typeof value === 'number' ? value : value.progress();
    return `${Math.round(progress)}%`;
  }
}
