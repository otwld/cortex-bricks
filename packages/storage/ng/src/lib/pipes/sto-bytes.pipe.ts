import { Pipe, PipeTransform } from '@angular/core';
import { formatBytes } from '../utils/storage-utils';

/** Angular pipe that formats byte counts using binary units. */
@Pipe({ name: 'stoBytes' })
export class StoBytesPipe implements PipeTransform {
  /** Formats a byte count with optional decimal precision. */
  transform(bytes: number, decimals?: number): string {
    return formatBytes(bytes, decimals);
  }
}
