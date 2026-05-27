import { createHash, randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { StorageDriver, StorageFile, UploadMeta } from '@otwld/ts-storage';
import { NormalizedStorageModuleOptions, STORAGE_MODULE_OPTIONS, StorageModuleOptions, validateStorageModuleOptions } from '../config/storage-module-options';
import { MultipartStorageDriver } from '../drivers/multipart-storage-driver';
import { StorageException } from '../exceptions/storage.exception';
import { HookRunnerService } from '../hooks/hook-runner.service';
import { StorageFileRecord } from '../schemas/storage-file.schema';
import { UploadState } from '../schemas/upload-state.schema';
import { TUS_MODULE_OPTIONS, TusModuleOptions } from './tus.tokens';

interface SaveableDocument {
  save(): Promise<unknown>;
}

interface UploadStateModel {
  create(value: Partial<UploadState>): Promise<UploadState & SaveableDocument>;
  findOne(query: Partial<UploadState>): { exec(): Promise<(UploadState & SaveableDocument) | null> };
  deleteOne(query: Partial<UploadState>): { exec(): Promise<unknown> };
}

interface StorageFileModel {
  create(value: Partial<StorageFileRecord>): Promise<StorageFileRecord & SaveableDocument>;
}

/** Response returned after creating a TUS upload. */
export interface TusUploadCreation {
  /** Driver multipart upload id. */
  uploadId: string;
  /** Final storage key for the upload. */
  key: string;
  /** Current uploaded byte offset. */
  offset: number;
  /** Upload expiration timestamp. */
  expiresAt: Date;
}

/** Public state returned for an in-progress TUS upload. */
export interface TusUploadState {
  /** Driver multipart upload id. */
  uploadId: string;
  /** Current uploaded byte offset. */
  offset: number;
  /** Total expected upload length in bytes. */
  length: number;
  /** Upload expiration timestamp. */
  expiresAt: Date;
  /** Persisted storage file metadata when this response completed the upload. */
  file?: StorageFile;
}

/**
 * Provides tus service behavior.
 */
@Injectable()
/** Coordinates TUS upload state, multipart drivers, checksum verification, and final file records. */
export class TusService {
  private readonly storageOptions: NormalizedStorageModuleOptions;
  private readonly logger = new Logger(TusService.name);

  /**
   * Creates a tus service instance.
   *
   * @param driver - driver value.
   *
   * @param uploadStateModel - upload state model value.
   *
   * @param storageFileModel - storage file model value.
   *
   * @param hookRunner - hook runner value.
   *
   * @param options - options value.
   *
   * @param rawStorageOptions - raw storage options value.
   */
  constructor(
    private readonly driver: MultipartStorageDriver,
    @InjectModel(UploadState.name) private readonly uploadStateModel: UploadStateModel,
    @InjectModel(StorageFileRecord.name) private readonly storageFileModel: StorageFileModel,
    private readonly hookRunner: HookRunnerService,
    @Inject(TUS_MODULE_OPTIONS) private readonly options: TusModuleOptions,
    @Inject(STORAGE_MODULE_OPTIONS) private readonly rawStorageOptions: StorageModuleOptions,
  ) {
    this.storageOptions = validateStorageModuleOptions(rawStorageOptions);
  }

  /**
   * Create a TUS upload state and optionally append the creation-with-upload initial chunk.
   *
   * @param meta - Upload metadata, including final size, filename, mimetype, and optional custom metadata.
   * @param initialChunk - Optional initial bytes from a creation-with-upload request.
   * @param checksum - Optional TUS checksum header for the initial chunk.
   * @returns Created upload location state with the current offset and expiry timestamp.
   * @throws StorageException When the upload exceeds configured size limits, metadata is unsafe, checksum validation fails, or hooks reject the upload.
   */
  async createUpload(meta: UploadMeta, initialChunk?: Buffer, checksum?: string): Promise<TusUploadCreation> {
    if (meta.size > this.options.maxSize) {
      throw StorageException.misconfigured(`Upload size ${meta.size} exceeds Tus-Max-Size ${this.options.maxSize}`);
    }
    if (initialChunk && initialChunk.length > meta.size) {
      throw StorageException.misconfigured(`Initial TUS chunk exceeds declared upload length ${meta.size}`);
    }

    await this.hookRunner.run('beforeUpload', meta);
    const key = this.createStorageKey(meta);
    const uploadId = await this.driver.createMultipartUpload(key, meta);
    const expiresAt = new Date(Date.now() + this.options.uploadStateTtl * 1000);
    const metadata = { ...(meta.metadata ?? {}), filename: meta.filename, mimetype: meta.mimetype };
    const document = await this.uploadStateModel.create({
      uploadId,
      key,
      offset: 0,
      length: meta.size,
      metadata: new Map(Object.entries(metadata)),
      parts: [],
      driver: this.storageOptions.driver,
      expiresAt,
    });

    if (initialChunk?.length) {
      await this.appendChunk(uploadId, 0, initialChunk, checksum);
      const refreshed = await this.findUpload(uploadId);
      this.logger.log(`Created TUS upload ${uploadId} for ${key}`);
      return { uploadId, key, offset: refreshed.offset, expiresAt: refreshed.expiresAt };
    }

    this.logger.log(`Created TUS upload ${uploadId} for ${key}`);
    return { uploadId, key, offset: document.offset, expiresAt };
  }

  /**
   * Return current offset, length, and expiration metadata for an in-progress upload.
   *
   * @param uploadId - Driver multipart upload identifier returned by `createUpload`.
   * @returns Public TUS upload state for HEAD/PATCH validation.
   * @throws StorageException When the upload cannot be found or has expired.
   */
  async getUpload(uploadId: string): Promise<TusUploadState> {
    const upload = await this.findUpload(uploadId);
    return {
      uploadId: upload.uploadId,
      offset: upload.offset,
      length: upload.length,
      expiresAt: upload.expiresAt,
    };
  }

  /**
   * Append a chunk at the expected offset and complete the upload when all declared bytes are received.
   *
   * @param uploadId - Driver multipart upload identifier returned by `createUpload`.
   * @param expectedOffset - Offset supplied by the client in the `Upload-Offset` header.
   * @param chunk - Request body bytes to append as the next multipart part.
   * @param checksum - Optional TUS checksum header for the chunk.
   * @returns Updated upload state, including a `file` record when the upload completes.
   * @throws StorageException When the offset is stale, checksum fails, chunk is empty, chunk exceeds remaining length, or the upload is missing/expired.
   */
  async appendChunk(uploadId: string, expectedOffset: number, chunk: Buffer, checksum?: string): Promise<TusUploadState> {
    const upload = await this.findUpload(uploadId);
    if (upload.offset !== expectedOffset) {
      this.logger.warn(`Upload ${uploadId} offset mismatch: expected ${upload.offset}, received ${expectedOffset}`);
      throw StorageException.offsetMismatch(`Expected Upload-Offset ${upload.offset}, received ${expectedOffset}`);
    }
    if (chunk.length === 0 || upload.offset + chunk.length > upload.length) {
      throw StorageException.misconfigured(`Chunk exceeds remaining upload length for ${uploadId}`);
    }
    try {
      verifyTusChecksum(chunk, checksum);
    } catch (error) {
      this.logger.warn(`Upload ${uploadId} checksum verification failed`);
      throw error;
    }

    const partNumber = upload.parts.length + 1;
    const etag = await this.driver.uploadPart(upload.uploadId, upload.key, partNumber, chunk);
    upload.parts.push({ partNumber, etag });
    upload.offset += chunk.length;
    await upload.save();

    let file: StorageFile | undefined;

    if (upload.offset === upload.length) {
      await this.driver.completeMultipartUpload(upload.uploadId, upload.key, upload.parts);
      const checksumValue = await this.hashStoredObject(upload.key);
      const record = await this.storageFileModel.create({
        key: upload.key,
        filename: upload.metadata.get('filename') ?? upload.key.split('/').pop() ?? upload.key,
        mimetype: upload.metadata.get('mimetype') ?? 'application/octet-stream',
        size: upload.length,
        driver: upload.driver,
        checksum: checksumValue,
        metadata: upload.metadata,
      });
      file = toStorageFile(record);
      await this.hookRunner.run('afterUpload', record as never);
      await this.uploadStateModel.deleteOne({ uploadId }).exec();
      this.logger.log(`Completed TUS upload ${uploadId} for ${upload.key}`);
    }

    return {
      uploadId: upload.uploadId,
      offset: upload.offset,
      length: upload.length,
      expiresAt: upload.expiresAt,
      file,
    };
  }

  /**
   * Abort a TUS upload and remove its state record.
   *
   * @param uploadId - Driver multipart upload identifier returned by `createUpload`.
   * @returns Resolves when driver cleanup and state deletion complete.
   * @throws StorageException When the upload cannot be found or has expired.
   */
  async abortUpload(uploadId: string): Promise<void> {
    const upload = await this.findUpload(uploadId);
    await this.driver.abortMultipartUpload(upload.uploadId, upload.key);
    await this.uploadStateModel.deleteOne({ uploadId }).exec();
    this.logger.log(`Aborted TUS upload ${uploadId}`);
  }

  private async findUpload(uploadId: string): Promise<UploadState & SaveableDocument> {
    const upload = await this.uploadStateModel.findOne({ uploadId }).exec();
    if (!upload) throw StorageException.uploadNotFound();
    if (upload.expiresAt <= new Date()) throw StorageException.uploadExpired();
    return upload;
  }

  private createStorageKey(meta: UploadMeta): string {
    const requestedKey = meta.metadata?.['key'];
    if (requestedKey) return this.validateClientStorageKey(requestedKey);
    const filename = meta.filename.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'upload';
    return `uploads/${randomUUID()}-${filename}`;
  }

  private validateClientStorageKey(key: string): string {
    if (!key.startsWith('uploads/') || key.includes('..') || key.includes('\0') || key.includes('//')) {
      throw StorageException.invalidStorageKey('TUS metadata key must stay under uploads/');
    }
    return key;
  }

  private async hashStoredObject(key: string): Promise<string> {
    const hash = createHash('sha256');
    const stream = await this.driver.getReadStream(key);
    for await (const chunk of stream as Readable) {
      hash.update(chunk);
    }
    return hash.digest('hex');
  }
}

type StorageFileRecordLike = Partial<StorageFileRecord> & {
  id?: string;
  _id?: { toString(): string };
  ownerId?: { toString(): string } | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  toJSON?: (options?: { flattenMaps?: boolean }) => Partial<StorageFileRecordLike>;
};

/** Convert Mongoose or in-memory file records into the shared wire contract. */
/**
 * Runs to storage file.
 *
 * @param record - record value.
 *
 * @returns The to storage file result.
 */
export function toStorageFile(record: StorageFileRecordLike): StorageFile {
  const raw = record.toJSON ? record.toJSON({ flattenMaps: true }) : record;
  const metadata = raw.metadata instanceof Map ? Object.fromEntries(raw.metadata) : raw.metadata;
  const now = new Date();

  return {
    id: String(raw.id ?? raw._id?.toString() ?? raw.key),
    key: raw.key ?? '',
    filename: raw.filename ?? '',
    mimetype: raw.mimetype ?? 'application/octet-stream',
    size: raw.size ?? 0,
    driver: raw.driver ?? StorageDriver.Filesystem,
    checksum: raw.checksum ?? '',
    metadata: metadata ? Object.fromEntries(Object.entries(metadata).map(([key, value]) => [key, String(value)])) : undefined,
    ownerId: raw.ownerId ? raw.ownerId.toString() : undefined,
    deletedAt: raw.deletedAt ? new Date(raw.deletedAt) : undefined,
    createdAt: raw.createdAt ? new Date(raw.createdAt) : now,
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : now,
  };
}

/**
 * Verify a TUS `Upload-Checksum` header against a chunk.
 *
 * @param chunk - Chunk bytes received from the TUS client.
 * @param checksum - Optional `Upload-Checksum` header value in `algorithm base64digest` form.
 * @returns Nothing when the checksum is absent or valid.
 * @throws StorageException When the checksum header is malformed, unsupported, or does not match the chunk.
 */
export function verifyTusChecksum(chunk: Buffer, checksum?: string): void {
  if (!checksum) return;
  const [algorithm, expected] = checksum.split(' ');
  if (!algorithm || !expected || !['sha1', 'sha256'].includes(algorithm)) {
    throw StorageException.checksumMismatch('Unsupported or malformed Upload-Checksum header');
  }
  const actual = createHash(algorithm).update(chunk).digest('base64');
  if (actual !== expected) {
    throw StorageException.checksumMismatch();
  }
}

/**
 * Decode a TUS `Upload-Metadata` header into key/value metadata.
 *
 * @param header - Optional comma-separated TUS metadata header with base64-encoded values.
 * @returns Decoded metadata object with UTF-8 string values.
 */
export function decodeTusMetadata(header?: string): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header
      .split(',')
      .filter(Boolean)
      .map((entry) => {
        const [key, value = ''] = entry.trim().split(' ');
        return [key, Buffer.from(value, 'base64').toString('utf8')];
      }),
  );
}

/**
 * Read an incoming Node stream into a bounded buffer.
 *
 * @param stream - Node readable stream carrying the request body.
 * @param maxBytes - Maximum number of bytes allowed before the stream is rejected.
 * @returns Buffered request body.
 * @throws StorageException When the stream exceeds `maxBytes`.
 */
export function bufferFromStream(stream: NodeJS.ReadableStream, maxBytes: number): Promise<Buffer> {
  return new Promise((resolvePromise, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    let failed = false;

    const fail = (error: unknown): void => {
      if (failed) return;
      failed = true;
      reject(error);
      if ('destroy' in stream && typeof stream.destroy === 'function') {
        stream.destroy();
      }
    };

    stream.on('data', (chunk: Buffer) => {
      if (failed) return;
      total += chunk.length;
      if (total > maxBytes) {
        fail(StorageException.misconfigured(`TUS request body exceeds allowed size ${maxBytes}`));
        return;
      }
      chunks.push(Buffer.from(chunk));
    });
    stream.on('error', fail);
    stream.on('end', () => {
      if (!failed) resolvePromise(Buffer.concat(chunks, total));
    });
  });
}
