import { StorageDriver } from '../enums/storage-driver.enum';

/** Persisted record describing a file stored by the library. */
export interface StorageFile {
  /** Stable storage record id. */
  id: string;
  /** Driver-relative key used to locate the object. */
  key: string;
  /** Original or normalized file name. */
  filename: string;
  /** MIME type recorded for the object. */
  mimetype: string;
  /** File size in bytes. */
  size: number;
  /** Storage backend that owns the object. */
  driver: StorageDriver;
  /** SHA-256 checksum of the stored bytes. */
  checksum: string;
  /** Optional user metadata stored with the file. */
  metadata?: Record<string, string>;
  /** Optional owner id associated with the file. */
  ownerId?: string;
  /** Soft-delete timestamp; absent for active files. */
  deletedAt?: Date;
  /** Record creation timestamp. */
  createdAt: Date;
  /** Record update timestamp. */
  updatedAt: Date;
}
