import { Controller, Delete, Head, Headers, HttpCode, Inject, Logger, Options, Param, Patch, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { StorageException } from '../exceptions/storage.exception';
import { bufferFromStream, decodeTusMetadata, TusService } from './tus.service';
import { TUS_MODULE_OPTIONS, TusModuleOptions } from './tus.tokens';

const TUS_VERSION = '1.0.0';
const TUS_EXTENSION = 'creation,creation-with-upload,termination,checksum,expiration';
const ALLOW_HEADERS = 'Tus-Resumable,Upload-Length,Upload-Offset,Upload-Metadata,Upload-Defer-Length,Upload-Concat,Upload-Checksum,Content-Type';
const EXPOSE_HEADERS = 'Tus-Resumable,Upload-Offset,Upload-Length,Location,Upload-Expires,Tus-Version,Tus-Extension,Storage-File';

/**
 * Provides tus controller behavior.
 */
@Controller('storage/tus')
/** HTTP controller implementing the TUS resumable upload protocol. */
export class TusController {
  private readonly logger = new Logger(TusController.name);

  /**
   * Creates a tus controller instance.
   *
   * @param tusService - tus service value.
   *
   * @param options - options value.
   */
  constructor(
    private readonly tusService: TusService,
    @Inject(TUS_MODULE_OPTIONS) private readonly options: TusModuleOptions,
  ) {}

  /**
   * Runs advertise.
   *
   * @param response - response value.
   *
   * @param request - request value.
   *
   * @throws When the operation cannot be completed.
   */
  @Options()
  /** Advertise supported TUS protocol features and CORS headers. */
  advertise(@Res() response: Response, @Req() request?: Request): void {
    this.logRequest('OPTIONS', request, '/storage/tus');
    try {
      this.applyTusHeaders(response);
      response.setHeader('Tus-Version', TUS_VERSION);
      response.setHeader('Tus-Extension', TUS_EXTENSION);
      response.status(204).send();
    } catch (error) {
      this.logError('OPTIONS /storage/tus failed', error);
      throw error;
    }
  }

  /**
   * Runs create.
   *
   * @param uploadLength - upload length value.
   *
   * @param uploadMetadata - upload metadata value.
   *
   * @param uploadChecksum - upload checksum value.
   *
   * @param request - request value.
   *
   * @param response - response value.
   *
   * @param uploadDeferLength - upload defer length value.
   *
   * @throws When the operation cannot be completed.
   */
  @Post()
  /** Create a new TUS upload and return its upload location. */
  async create(
    @Headers('upload-length') uploadLength: string | undefined,
    @Headers('upload-metadata') uploadMetadata: string | undefined,
    @Headers('upload-checksum') uploadChecksum: string | undefined,
    @Req() request: Request,
    @Res() response: Response,
    @Headers('upload-defer-length') uploadDeferLength: string | undefined,
  ): Promise<void> {
    this.logRequest('POST', request, '/storage/tus');
    try {
      if (uploadLength === undefined && uploadDeferLength !== '1') {
        throw StorageException.invalidStorageKey('Upload-Length or Upload-Defer-Length: 1 is required');
      }
      const metadata = decodeTusMetadata(uploadMetadata);
      const parsedLength = parseUploadLength(uploadLength);
      const body = await bufferFromStream(request, Math.min(parsedLength ?? this.options.maxSize, this.options.maxSize));
      const created = await this.tusService.createUpload(
        {
          filename: metadata['filename'] ?? 'upload',
          mimetype: metadata['mimetype'] ?? request.header('content-type') ?? 'application/octet-stream',
          size: parsedLength ?? body.length,
          metadata,
        },
        body.length ? body : undefined,
        uploadChecksum,
      );

      this.applyTusHeaders(response);
      response.setHeader('Location', `${(this.options.path ?? '/storage/tus').replace(/\/$/, '')}/${encodeURIComponent(created.uploadId)}`);
      response.setHeader('Upload-Offset', String(created.offset));
      response.setHeader('Upload-Expires', created.expiresAt.toUTCString());
      response.status(201).send();
    } catch (error) {
      this.logError('POST /storage/tus failed', error);
      throw error;
    }
  }

  /**
   * Runs head.
   *
   * @param id - id value.
   *
   * @param response - response value.
   *
   * @param request - request value.
   *
   * @throws When the operation cannot be completed.
   */
  @Head(':id')
  /** Return offset and expiration metadata for an upload. */
  async head(@Param('id') id: string, @Res() response: Response, @Req() request?: Request): Promise<void> {
    this.logRequest('HEAD', request, `/storage/tus/${id}`);
    try {
      const upload = await this.tusService.getUpload(id);
      this.applyTusHeaders(response);
      response.setHeader('Upload-Offset', String(upload.offset));
      response.setHeader('Upload-Length', String(upload.length));
      response.setHeader('Upload-Expires', upload.expiresAt.toUTCString());
      response.status(204).send();
    } catch (error) {
      this.logError(`HEAD /storage/tus/${id} failed`, error);
      throw error;
    }
  }

  /**
   * Runs patch.
   *
   * @param id - id value.
   *
   * @param uploadOffset - upload offset value.
   *
   * @param uploadChecksum - upload checksum value.
   *
   * @param request - request value.
   *
   * @param response - response value.
   *
   * @throws When the operation cannot be completed.
   */
  @Patch(':id')
  /** Append bytes to an upload at the requested offset. */
  async patch(
    @Param('id') id: string,
    @Headers('upload-offset') uploadOffset: string,
    @Headers('upload-checksum') uploadChecksum: string | undefined,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    this.logRequest('PATCH', request, `/storage/tus/${id}`);
    try {
      const state = await this.tusService.getUpload(id);
      const body = await bufferFromStream(request, Math.max(state.length - state.offset, 0));
      const upload = await this.tusService.appendChunk(id, Number(uploadOffset), body, uploadChecksum);
      this.applyTusHeaders(response);
      response.setHeader('Upload-Offset', String(upload.offset));
      response.setHeader('Upload-Expires', upload.expiresAt.toUTCString());
      if (upload.file) response.setHeader('Storage-File', JSON.stringify(upload.file));
      response.status(204).send();
    } catch (error) {
      this.logError(`PATCH /storage/tus/${id} failed`, error);
      throw error;
    }
  }

  /**
   * Runs delete.
   *
   * @param id - id value.
   *
   * @param response - response value.
   *
   * @param request - request value.
   *
   * @throws When the operation cannot be completed.
   */
  @Delete(':id')
  @HttpCode(204)
  /** Abort an upload and remove its server-side state. */
  async delete(@Param('id') id: string, @Res() response: Response, @Req() request?: Request): Promise<void> {
    this.logRequest('DELETE', request, `/storage/tus/${id}`);
    try {
      await this.tusService.abortUpload(id);
      this.applyTusHeaders(response);
      response.status(204).send();
    } catch (error) {
      this.logError(`DELETE /storage/tus/${id} failed`, error);
      throw error;
    }
  }

  private applyTusHeaders(response: Response): void {
    response.setHeader('Tus-Resumable', TUS_VERSION);
    response.setHeader('Tus-Version', TUS_VERSION);
    response.setHeader('Tus-Extension', TUS_EXTENSION);
    response.setHeader('Tus-Max-Size', String(this.options.maxSize));
    response.setHeader('Access-Control-Allow-Origin', this.options.allowOrigin ?? '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST,HEAD,PATCH,DELETE,OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', ALLOW_HEADERS);
    response.setHeader('Access-Control-Expose-Headers', EXPOSE_HEADERS);
  }

  private logRequest(method: string, request: Request | undefined, fallbackPath: string): void {
    this.logger.verbose(`${method} ${request?.originalUrl ?? request?.url ?? fallbackPath}`);
  }

  private logError(message: string, error: unknown): void {
    this.logger.error(message, error instanceof Error ? error.stack : String(error));
  }
}

function parseUploadLength(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw StorageException.invalidStorageKey('Upload-Length must be a non-negative integer');
  }
  return parsed;
}
