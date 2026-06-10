import { UploadStatus } from '@otwld/ts-storage';
import { StorageClientError, StorageClientErrorCode } from '../exceptions/storage-client-error';
import { UploadTask } from '../models/upload-task';

/**
 * Formats bytes using binary units from B through TB.
 *
 * @param bytes - Byte count to format.
 * @param decimals - Decimal precision to preserve.
 * @returns Human-readable byte count.
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, unitIndex);
  return `${Number(value.toFixed(decimals))} ${units[unitIndex]}`;
}

/**
 * Returns whether a file matches an accept string.
 *
 * @param file - File selected by the user.
 * @param accept - Comma-separated extension or MIME accept rules.
 * @returns True when the file satisfies at least one accept rule.
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

/**
 * Calculates average progress across upload tasks.
 *
 * @param tasks - Upload tasks to aggregate.
 * @returns Average progress percentage, or zero for an empty list.
 */
export function getUploadProgress(tasks: readonly Pick<UploadTask, 'progress'>[]): number {
  return tasks.length ? tasks.reduce((total, task) => total + task.progress(), 0) / tasks.length : 0;
}

/**
 * Groups upload tasks by their current status signal value.
 *
 * @param tasks - Upload tasks to group.
 * @returns Record keyed by upload status.
 */
export function groupByStatus<TTask extends Pick<UploadTask, 'status'>>(tasks: readonly TTask[]): Record<UploadStatus, TTask[]> {
  const grouped: Record<UploadStatus, TTask[]> = {
    [UploadStatus.Pending]: [],
    [UploadStatus.Active]: [],
    [UploadStatus.Paused]: [],
    [UploadStatus.Completed]: [],
    [UploadStatus.Failed]: [],
  };
  for (const task of tasks) grouped[task.status()].push(task);
  return grouped;
}

/**
 * Creates a SHA-256 hash for the bytes in a browser `File`.
 *
 * @param file - Browser file to hash.
 * @returns Hex-encoded SHA-256 digest.
 * @throws StorageClientError when SubtleCrypto is unavailable.
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
