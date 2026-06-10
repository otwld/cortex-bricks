import { createHash } from 'node:crypto';
import { Readable, Transform } from 'node:stream';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { StorageDriver as StorageDriverKind, StorageFile, UploadMeta } from '@otwld/ts-storage';
import mongoose, { Model } from 'mongoose';
import { StorageDriver } from '../drivers/storage-driver';
import { StorageException } from '../exceptions/storage.exception';
import { HookRunnerService } from '../hooks/hook-runner.service';
import { NOT_SOFT_DELETED, StorageFileDocument, StorageFileRecord } from '../schemas/storage-file.schema';

/** Mongoose model operations required by the storage service. */
type StorageFileModel = Pick<Model<StorageFileRecord>, 'create' | 'findById' | 'deleteOne' | 'find'>;

/** Options controlling file deletion behavior. */
export interface DeleteFileOptions {
  /** Delete bytes and database record instead of setting `deletedAt`. */
  hard?: boolean;
}

/** Options controlling file listing behavior. */
export interface ListFilesOptions {
  /** Include soft-deleted files in the result. */
  includeDeleted?: boolean;
}

/** High-level service for storing, listing, signing, and deleting files. */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  /**
   * Create the high-level storage service.
   *
   * @param driver - Active storage driver selected by module options.
   * @param hookRunner - Lifecycle hook runner for upload and delete policies.
   * @param storageFileModel - Mongoose model for persisted file records.
   */
  constructor(
    private readonly driver: StorageDriver,
    private readonly hookRunner: HookRunnerService,
    @InjectModel(StorageFileRecord.name) private readonly storageFileModel: StorageFileModel,
  ) {}

  /** Store a readable stream and create its file record. */
  async putFile(
    key: string,
    stream: Readable,
    meta: UploadMeta,
    options: { ownerId?: string; driver: StorageDriverKind; maxSize?: number },
  ): Promise<StorageFileDocument> {
    try {
      await this.hookRunner.runBeforeUpload(meta);

      const hash = createHash('sha256');
      let bytesSeen = 0;
      const limit = options.maxSize ?? meta.size;
      const inspector = new Transform({
        transform(chunk: Buffer, _encoding, callback) {
          bytesSeen += chunk.length;
          if (limit && bytesSeen > limit) {
            callback(StorageException.driver(`Stream exceeded declared size of ${limit} bytes`));
            return;
          }
          hash.update(chunk);
          callback(null, chunk);
        },
      });

      await this.driver.put(key, stream.pipe(inspector), meta);
      const checksum = hash.digest('hex');
      const file = await this.createFileRecord(key, meta, checksum, options.driver, options.ownerId);
      this.logger.log(`Stored file ${file.id} (${meta.size} bytes) at ${key}`);
      await this.hookRunner.runAfterUpload(file);
      return file;
    } catch (error) {
      this.logger.error(`Failed to store file at ${key}`, error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  /** Create only the database record for an already-stored object. */
  async createFileRecord(key: string, meta: UploadMeta, checksum: string, driver: StorageDriverKind, ownerId?: string): Promise<StorageFileDocument> {
    return this.storageFileModel.create({
      key,
      filename: meta.filename,
      mimetype: meta.mimetype,
      size: meta.size,
      driver,
      checksum,
      metadata: meta.metadata ? new Map(Object.entries(meta.metadata)) : undefined,
      ownerId: ownerId ? new mongoose.Types.ObjectId(ownerId) : undefined,
    });
  }

  /** Load an active file by id or throw when it is missing or soft-deleted. */
  async getFile(id: string): Promise<StorageFileDocument> {
    const file = await this.storageFileModel.findById(id).exec();
    if (!file || file.deletedAt) throw StorageException.fileNotFound();
    return file;
  }

  /** Soft- or hard-delete a file and invoke delete hooks. */
  async deleteFile(id: string, options: DeleteFileOptions = {}): Promise<void> {
    try {
      const file = await this.getFile(id);
      await this.hookRunner.runBeforeDelete(file);
      if (options.hard) {
        await this.driver.delete(file.key);
        await this.storageFileModel.deleteOne({ _id: file._id }).exec();
      } else {
        file.deletedAt = new Date();
        await file.save();
      }
      await this.hookRunner.runAfterDelete(file);
      this.logger.log(`${options.hard ? 'Hard-deleted' : 'Soft-deleted'} file ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${id}`, error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  /** Generate a signed read URL for a storage key. */
  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    return this.driver.getSignedUrl(key, expiresIn);
  }

  /** List files matching a filter, excluding soft-deleted rows by default. */
  async listFiles(filter: Partial<StorageFile> = {}, options: ListFilesOptions = {}): Promise<StorageFileDocument[]> {
    const query: Record<string, unknown> = { ...filter };
    if (!options.includeDeleted) Object.assign(query, NOT_SOFT_DELETED);
    if (typeof filter.ownerId === 'string') query['ownerId'] = new mongoose.Types.ObjectId(filter.ownerId);
    return this.storageFileModel.find(query).exec();
  }

  /** Return the stored SHA-256 checksum for a file. */
  async getChecksum(id: string): Promise<string> {
    return (await this.getFile(id)).checksum;
  }
}
