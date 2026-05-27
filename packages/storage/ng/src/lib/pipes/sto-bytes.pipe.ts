import { Pipe, PipeTransform } from '@angular/core';
import { formatBytes } from '../utils/storage-utils';

/**
 * Provides sto bytes pipe behavior.
 */
@Pipe({ name: 'stoBytes' })
/** Angular pipe that formats byte counts using binary units. */
export class StoBytesPipe implements PipeTransform {
  /** Format a byte count with optional decimal precision. */
  /**
   * Runs transform.
   *
   * @param bytes - bytes value.
   *
   * @param decimals - decimals value.
   *
   * @returns The sto bytes pipe transform result.
   */
  transform(bytes: number, decimals?: number): string {
    return formatBytes(bytes, decimals);
  }
}
