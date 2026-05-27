import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, rename, rm, stat, unlink } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Part, StorageDriver as StorageDriverKind, UploadMeta } from '@otwld/ts-storage';
import { NormalizedStorageModuleOptions, STORAGE_MODULE_OPTIONS, StorageModuleOptions, validateStorageModuleOptions } from '../config/storage-module-options';
import { StorageException } from '../exceptions/storage.exception';
import { createFilesystemSignedToken } from './filesystem-signed-url';
import { MultipartStorageDriver } from './multipart-storage-driver';

/**
 * Provides filesystem storage driver behavior.
 */
@Injectable()
/** Filesystem-backed storage driver rooted at a configured directory. */
export class FilesystemStorageDriver extends MultipartStorageDriver {
  private readonly options: NormalizedStorageModuleOptions;
  private readonly logger = new Logger(FilesystemStorageDriver.name);
  private readonly rootPath: string;

  /**
   * Creates a filesystem storage driver instance.
   *
   * @param options - options value.
   *
   * @throws When the operation cannot be completed.
   */
  constructor(@Inject(STORAGE_MODULE_OPTIONS) options: StorageModuleOptions) {
    super();
    this.options = validateStorageModuleOptions(options);
    if (this.options.driver !== StorageDriverKind.Filesystem || !this.options.filesystem) {
      throw StorageException.misconfigured('FilesystemStorageDriver requires filesystem storage options');
    }
    this.rootPath = resolve(this.options.filesystem.rootPath);
  }

  /** Store a stream atomically at a relative filesystem key. */
  /**
   * Runs put.
   *
   * @param key - key value.
   *
   * @param stream - stream value.
   *
   * @param meta - meta value.
   */
  async put(key: string, stream: Readable, meta: UploadMeta): Promise<void> {
    void meta;
    const target = this.resolveKey(key);
    const temp = `${target}.${randomUUID()}.tmp`;
    await mkdir(dirname(target), { recursive: true });
    await pipeline(stream, createWriteStream(temp));
    await rename(temp, target);
  }

  /** Delete a file if it exists. */
  /**
   * Runs delete.
   *
   * @param key - key value.
   *
   * @throws When the operation cannot be completed.
   */
  async delete(key: string): Promise<void> {
    try {
      await unlink(this.resolveKey(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw StorageException.driver('Failed to delete file', error);
    }
  }

  /** Generate a signed filesystem read URL. */
  /**
   * Runs get signed url.
   *
   * @param key - key value.
   *
   * @param expiresIn - expires in value.
   *
   * @returns The filesystem storage driver get signed url result.
   *
   * @throws When the operation cannot be completed.
   */
  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    const filesystem = this.options.filesystem;
    if (!filesystem) throw StorageException.misconfigured('Filesystem storage options are missing');
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
    const token = createFilesystemSignedToken(key, filesystem.signedUrlSecret, expiresAt);
    return `${filesystem.publicPath.replace(/\/$/, '')}/${token}`;
  }

  /** Open a readable stream for a stored file. */
  /**
   * Runs get read stream.
   *
   * @param key - key value.
   *
   * @returns The filesystem storage driver get read stream result.
   *
   * @throws When the operation cannot be completed.
   */
  async getReadStream(key: string): Promise<Readable> {
    const target = this.resolveKey(key);
    if (!(await this.exists(key))) throw StorageException.fileNotFound();
    return createReadStream(target);
  }

  /** Return whether a stored file exists. */
  /**
   * Runs exists.
   *
   * @param key - key value.
   *
   * @returns The filesystem storage driver exists result.
   *
   * @throws When the operation cannot be completed.
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await stat(this.resolveKey(key));
      return result.isFile();
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
      throw StorageException.driver('Failed to check file existence', error);
    }
  }

  /** Create a local multipart staging directory and return its upload id. */
  /**
   * Runs create multipart upload.
   *
   * @param key - key value.
   *
   * @param meta - meta value.
   *
   * @returns The filesystem storage driver create multipart upload result.
   */
  async createMultipartUpload(key: string, meta: UploadMeta): Promise<string> {
    void key;
    void meta;
    const uploadId = randomUUID();
    await mkdir(this.multipartDir(uploadId), { recursive: true });
    this.logger.debug(`Created multipart upload ${uploadId}`);
    return uploadId;
  }

  /** Store one multipart chunk in the upload staging directory. */
  /**
   * Runs upload part.
   *
   * @param uploadId - upload id value.
   *
   * @param _key - key value.
   *
   * @param partNumber - part number value.
   *
   * @param chunk - chunk value.
   *
   * @returns The filesystem storage driver upload part result.
   */
  async uploadPart(uploadId: string, _key: string, partNumber: number, chunk: Buffer): Promise<string> {
    const directory = this.multipartDir(uploadId);
    await mkdir(directory, { recursive: true });
    const partPath = join(directory, `${partNumber}.part`);
    await pipeline(Readable.from([chunk]), createWriteStream(partPath));
    return createHash('sha256').update(chunk).digest('hex');
  }

  /** Assemble staged multipart chunks into the final file. */
  /**
   * Runs complete multipart upload.
   *
   * @param uploadId - upload id value.
   *
   * @param key - key value.
   *
   * @param parts - parts value.
   */
  async completeMultipartUpload(uploadId: string, key: string, parts: Part[]): Promise<void> {
    this.logger.debug(`Completing multipart upload ${uploadId} for ${key}`);
    const target = this.resolveKey(key);
    const temp = `${target}.${randomUUID()}.tmp`;
    await mkdir(dirname(target), { recursive: true });

    const writeStream = createWriteStream(temp);
    try {
      for (const part of [...parts].sort((a, b) => a.partNumber - b.partNumber)) {
        await pipeline(createReadStream(join(this.multipartDir(uploadId), `${part.partNumber}.part`)), writeStream, {
          end: false,
        });
      }
    } finally {
      await new Promise<void>((resolvePromise, reject) => {
        writeStream.end((error?: Error | null) => (error ? reject(error) : resolvePromise()));
      });
    }

    await rename(temp, target);
    await this.abortMultipartUpload(uploadId, key);
  }

  /** Remove local multipart staging data. */
  /**
   * Runs abort multipart upload.
   *
   * @param uploadId - upload id value.
   *
   * @param key - key value.
   */
  async abortMultipartUpload(uploadId: string, key: string): Promise<void> {
    void key;
    this.logger.debug(`Aborting multipart upload ${uploadId}`);
    await rm(this.multipartDir(uploadId), { recursive: true, force: true });
  }

  private multipartDir(uploadId: string): string {
    if (!/^[a-zA-Z0-9_-]+$/.test(uploadId)) throw StorageException.invalidStorageKey('Invalid upload id');
    return join(this.rootPath, '.tus', uploadId);
  }

  private resolveKey(key: string): string {
    if (!key || key.startsWith('/') || key.includes('\0')) {
      this.logger.warn(`Rejected suspicious key: ${key}`);
      throw StorageException.invalidStorageKey();
    }

    const target = resolve(this.rootPath, key);
    const rootWithSep = this.rootPath.endsWith(sep) ? this.rootPath : `${this.rootPath}${sep}`;
    if (target !== this.rootPath && !target.startsWith(rootWithSep)) {
      this.logger.warn(`Rejected suspicious key: ${key}`);
      throw StorageException.invalidStorageKey();
    }
    return target;
  }
}
