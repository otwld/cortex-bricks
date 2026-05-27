import { UploadStatus } from '@otwld/ts-storage';
import { StorageClientError, StorageClientErrorCode } from '../exceptions/storage-client-error';
import { UploadTask } from '../models/upload-task';

/** Format bytes using binary units from B through TB. */
/**
 * Runs format bytes.
 *
 * @param bytes - bytes value.
 *
 * @param decimals - decimals value.
 *
 * @returns The format bytes result.
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, unitIndex);
  return `${Number(value.toFixed(decimals))} ${units[unitIndex]}`;
}

/** Return whether a file matches an accept string. */
/**
 * Runs is mime type allowed.
 *
 * @param file - file value.
 *
 * @param accept - accept value.
 *
 * @returns The is mime type allowed result.
 */
export function isMimeTypeAllowed(file: File, accept: string): boolean {
  if (!accept.trim()) return true;
  const filename = file.name.toLowerCase();
  return accept.split(',').some((rule) => {
    const normalized = rule.trim().toLowerCase();
    if (!normalized) return false;
    if (normalized.startsWith('.')) return filename.endsWith(normalized);
    if (normalized.endsWith('/*')) return file.type.toLowerCase().startsWith(normalized.slice(0, -1));
    return file.type.toLowerCase() === normalized;
  });
}

/** Calculate average progress across upload tasks. */
/**
 * Runs get upload progress.
 *
 * @param tasks - tasks value.
 *
 * @returns The get upload progress result.
 */
export function getUploadProgress(tasks: UploadTask[]): number {
  return tasks.length ? tasks.reduce((total, task) => total + task.progress(), 0) / tasks.length : 0;
}

/** Group upload tasks by their current status signal value. */
/**
 * Runs group by status.
 *
 * @param tasks - tasks value.
 *
 * @returns The group by status result.
 */
export function groupByStatus(tasks: UploadTask[]): Record<UploadStatus, UploadTask[]> {
  const grouped: Record<UploadStatus, UploadTask[]> = {
    [UploadStatus.Pending]: [],
    [UploadStatus.Active]: [],
    [UploadStatus.Paused]: [],
    [UploadStatus.Completed]: [],
    [UploadStatus.Failed]: [],
  };
  for (const task of tasks) grouped[task.status()].push(task);
  return grouped;
}

/** Create a SHA-256 hash for the bytes in a browser `File`. */
/**
 * Runs create file hash.
 *
 * @param file - file value.
 *
 * @returns The create file hash result.
 *
 * @throws When the operation cannot be completed.
 */
export async function createFileHash(file: File): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new StorageClientError(StorageClientErrorCode.INVALID_FILE, 'SubtleCrypto is required to hash uploads');
  }
  const digest = await globalThis.crypto.subtle.digest('SHA-256', await readFileArrayBuffer(file));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function readFileArrayBuffer(file: File): Promise<ArrayBuffer> {
  const arrayBuffer = (file as { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer;
  if (arrayBuffer) return arrayBuffer.call(file);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.readAsArrayBuffer(file);
  });
}
