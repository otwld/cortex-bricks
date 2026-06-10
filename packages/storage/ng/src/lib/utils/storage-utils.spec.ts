import { signal } from '@angular/core';
import { UploadStatus } from '@otwld/ts-storage';
import { createFileHash, formatBytes, getUploadProgress, groupByStatus, isMimeTypeAllowed } from './storage-utils';

describe('storage utils', () => {
  it('formats byte counts with binary units', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5 MB');
  });

  it('matches file extensions, exact mime types, and wildcard mime groups', () => {
    const file = new File(['x'], 'photo.PNG', { type: 'image/png' });

    expect(isMimeTypeAllowed(file, 'application/pdf,image/*')).toBe(true);
    expect(isMimeTypeAllowed(file, '.png')).toBe(true);
    expect(isMimeTypeAllowed(file, 'application/pdf')).toBe(false);
  });

  it('calculates aggregate progress and groups tasks by upload status', () => {
    const tasks = [
      { progress: signal(25), status: signal(UploadStatus.Active) },
      { progress: signal(75), status: signal(UploadStatus.Completed) },
    ];

    expect(getUploadProgress(tasks)).toBe(50);
    expect(groupByStatus(tasks)[UploadStatus.Active]).toEqual([tasks[0]]);
    expect(groupByStatus(tasks)[UploadStatus.Completed]).toEqual([tasks[1]]);
  });
});

describe('formatBytes edge cases', () => {
  it('returns "0 B" for negative input', () => {
    expect(formatBytes(-1)).toBe('0 B');
    expect(formatBytes(-1024)).toBe('0 B');
  });

  it('returns "0 B" for NaN', () => {
    expect(formatBytes(Number.NaN)).toBe('0 B');
  });

  it('returns "0 B" for Infinity', () => {
    expect(formatBytes(Number.POSITIVE_INFINITY)).toBe('0 B');
    expect(formatBytes(Number.NEGATIVE_INFINITY)).toBe('0 B');
  });
});

describe('createFileHash', () => {
  it('produces a stable SHA-256 of the file bytes', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'a.bin');
    const hash = await createFileHash(file);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
