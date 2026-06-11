import { Readable } from 'node:stream';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Part, StorageDriver as StorageDriverKind, UploadMeta } from '@otwld/ts-storage';
import { NormalizedStorageModuleOptions, STORAGE_MODULE_OPTIONS, StorageModuleOptions, validateStorageModuleOptions } from '../config/storage-module-options';
import { StorageException } from '../exceptions/storage.exception';
import { MultipartStorageDriver } from './multipart-storage-driver';

type S3ClientModule = typeof import('@aws-sdk/client-s3');
type PresignerModule = typeof import('@aws-sdk/s3-request-presigner');

/** S3-compatible storage driver with lazy AWS SDK imports. */
@Injectable()
export class S3StorageDriver extends MultipartStorageDriver {
  private readonly options: NormalizedStorageModuleOptions;
  private readonly logger = new Logger(S3StorageDriver.name);
  private client?: InstanceType<S3ClientModule['S3Client']>;
  private s3Module?: S3ClientModule;
  private presignerModule?: PresignerModule;

  /**
   * Create an S3-compatible storage driver from module options.
   *
   * @param rawOptions - Raw storage module options supplied through Nest DI.
   * @throws When the operation cannot be completed.
   */
  constructor(@Inject(STORAGE_MODULE_OPTIONS) private readonly rawOptions: StorageModuleOptions) {
    super();
    if (rawOptions.driver !== StorageDriverKind.S3) {
      throw StorageException.misconfigured('S3StorageDriver requires S3 storage options');
    }
    this.options = validateStorageModuleOptions(rawOptions);
  }

  /** Upload a stream to S3 with content type and sanitized metadata. */
  async put(key: string, stream: Readable, meta: UploadMeta): Promise<void> {
    const s3 = await this.aws();
    this.logger.debug(`PUT s3://${this.bucket()}/${key} (${meta.size} bytes)`);
    await this.getClient().send(
      new s3.PutObjectCommand({
        Bucket: this.bucket(),
        Key: key,
        Body: stream,
        ContentType: meta.mimetype,
        Metadata: this.sanitizeMetadata(meta.metadata),
      }),
    );
  }

  /** Delete an S3 object. */
  async delete(key: string): Promise<void> {
    const s3 = await this.aws();
    this.logger.debug(`DELETE s3://${this.bucket()}/${key}`);
    await this.getClient().send(new s3.DeleteObjectCommand({ Bucket: this.bucket(), Key: key }));
  }

  /** Generate a clamped S3 presigned read URL. */
  async getSignedUrl(key: string, expiresIn?: number): Promise<string> {
    const max = this.options.s3?.signedUrlMaxTtl ?? 86_400;
    const clamped = Math.min(Math.max(1, expiresIn ?? max), max);
    const s3 = await this.aws();
    const presigner = await this.presigner();
    return presigner.getSignedUrl(this.getClient(), new s3.GetObjectCommand({ Bucket: this.bucket(), Key: key }), {
      expiresIn: clamped,
    });
  }

  /** Open a readable stream for an S3 object. */
  async getReadStream(key: string): Promise<Readable> {
    const s3 = await this.aws();
    const response = await this.getClient().send(new s3.GetObjectCommand({ Bucket: this.bucket(), Key: key }));
    if (!response.Body) throw StorageException.fileNotFound();
    return response.Body as Readable;
  }

  /** S3 signed reads are served by S3 presigned URLs, not by the Nest route. */
  getSignedReadStream(): Promise<Readable> {
    throw StorageException.misconfigured('S3 signed reads are served by presigned S3 URLs');
  }

  /** Return whether an S3 object exists. */
  async exists(key: string): Promise<boolean> {
    const s3 = await this.aws();
    try {
      await this.getClient().send(new s3.HeadObjectCommand({ Bucket: this.bucket(), Key: key }));
      return true;
    } catch (error) {
      if ((error as { name?: string }).name === 'NotFound' || (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw StorageException.driver('Failed to check S3 object existence', error);
    }
  }

  /** Create an S3 multipart upload and return its upload id. */
  async createMultipartUpload(key: string, meta: UploadMeta): Promise<string> {
    const s3 = await this.aws();
    const result = await this.getClient().send(
      new s3.CreateMultipartUploadCommand({
        Bucket: this.bucket(),
        Key: key,
        ContentType: meta.mimetype,
        Metadata: this.sanitizeMetadata(meta.metadata),
      }),
    );
    if (!result.UploadId) throw StorageException.driver('S3 did not return a multipart upload id');
    this.logger.debug(`Created multipart upload ${result.UploadId} for s3://${this.bucket()}/${key}`);
    return result.UploadId;
  }

  /** Upload one S3 multipart chunk. */
  async uploadPart(uploadId: string, key: string, partNumber: number, chunk: Buffer): Promise<string> {
    const s3 = await this.aws();
    const result = await this.getClient().send(
      new s3.UploadPartCommand({
        Bucket: this.bucket(),
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
        Body: chunk,
      }),
    );
    if (!result.ETag) throw StorageException.driver('S3 did not return an ETag for uploaded part');
    return result.ETag;
  }

  /** Complete an S3 multipart upload from the supplied parts. */
  async completeMultipartUpload(uploadId: string, key: string, parts: Part[]): Promise<void> {
    const s3 = await this.aws();
    this.logger.debug(`Completing multipart upload ${uploadId} for s3://${this.bucket()}/${key}`);
    await this.getClient().send(
      new s3.CompleteMultipartUploadCommand({
        Bucket: this.bucket(),
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts
            .slice()
            .sort((a, b) => a.partNumber - b.partNumber)
            .map((part) => ({ PartNumber: part.partNumber, ETag: part.etag })),
        },
      }),
    );
  }

  /** Abort an S3 multipart upload. */
  async abortMultipartUpload(uploadId: string, key: string): Promise<void> {
    const s3 = await this.aws();
    this.logger.debug(`Aborting multipart upload ${uploadId} for s3://${this.bucket()}/${key}`);
    await this.getClient().send(new s3.AbortMultipartUploadCommand({ Bucket: this.bucket(), Key: key, UploadId: uploadId }));
  }

  private async aws(): Promise<S3ClientModule> {
    if (this.s3Module) return this.s3Module;
    try {
      this.s3Module = await import('@aws-sdk/client-s3');
      return this.s3Module;
    } catch (error) {
      this.logger.error('Failed to load AWS S3 SDK', error instanceof Error ? error.stack : String(error));
      throw StorageException.misconfigured('S3 storage requires optional peer dependencies @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner', error);
    }
  }

  private async presigner(): Promise<PresignerModule> {
    if (this.presignerModule) return this.presignerModule;
    try {
      this.presignerModule = await import('@aws-sdk/s3-request-presigner');
      return this.presignerModule;
    } catch (error) {
      throw StorageException.misconfigured('S3 signed URLs require @aws-sdk/s3-request-presigner', error);
    }
  }

  private getClient(): InstanceType<S3ClientModule['S3Client']> {
    if (this.client) return this.client;
    if (!this.s3Module) {
      throw StorageException.misconfigured('S3 client was used before AWS SDK was loaded');
    }
    const options = this.options.s3;
    if (!options) throw StorageException.misconfigured('S3 options are missing');
    this.client = new this.s3Module.S3Client({
      region: options.region,
      endpoint: options.endpoint,
      forcePathStyle: options.forcePathStyle,
      credentials:
        options.accessKeyId && options.secretAccessKey
          ? {
              accessKeyId: options.accessKeyId,
              secretAccessKey: options.secretAccessKey,
              sessionToken: options.sessionToken,
            }
          : undefined,
    });
    return this.client;
  }

  private bucket(): string {
    const bucket = this.options.s3?.bucket;
    if (!bucket) throw StorageException.misconfigured('S3 bucket is not configured');
    return bucket;
  }

  private sanitizeMetadata(metadata: Record<string, string> | undefined): Record<string, string> | undefined {
    if (!metadata) return undefined;
    let total = 0;
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof key !== 'string' || typeof value !== 'string') {
        throw StorageException.driver('S3 metadata keys and values must be strings');
      }
      if (!/^[\x20-\x7E]+$/.test(key) || !/^[\x20-\x7E]+$/.test(value)) {
        throw StorageException.driver(`S3 metadata contains non-ASCII characters in "${key}"`);
      }
      total += key.length + value.length;
    }
    if (total > 2048) throw StorageException.driver(`S3 metadata exceeds 2 KB (${total} bytes)`);
    return metadata;
  }
}
