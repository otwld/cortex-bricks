import { HttpException, HttpStatus } from '@nestjs/common';

/** Machine-readable storage error codes returned in `StorageException` responses. */
export enum StorageExceptionCode {
  /** Requested file record or object was not found. */
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  /** Resumable upload state expired. */
  UPLOAD_EXPIRED = 'UPLOAD_EXPIRED',
  /** Resumable upload id was not found. */
  UPLOAD_NOT_FOUND = 'UPLOAD_NOT_FOUND',
  /** Client upload offset does not match server state. */
  UPLOAD_OFFSET_MISMATCH = 'UPLOAD_OFFSET_MISMATCH',
  /** Storage backend operation failed. */
  DRIVER_ERROR = 'DRIVER_ERROR',
  /** Supplied checksum does not match payload bytes. */
  CHECKSUM_MISMATCH = 'CHECKSUM_MISMATCH',
  /** A configured hook rejected the operation. */
  HOOK_REJECTED = 'HOOK_REJECTED',
  /** Storage module or driver configuration is invalid. */
  MISCONFIGURED = 'MISCONFIGURED',
  /** Storage key is empty, absolute, or escapes the configured root. */
  INVALID_STORAGE_KEY = 'INVALID_STORAGE_KEY',
}

/** HTTP exception carrying a stable storage error code and optional cause. */
export class StorageException extends HttpException {
  /**
   * Create a storage exception with a stable code, HTTP status, and optional
   * underlying cause.
   *
   * @param code - Machine-readable error code returned in the response body.
   * @param message - Human-readable failure message.
   * @param status - HTTP status code for the response.
   * @param originalCause - Lower-level error that triggered this exception.
   */
  constructor(
    readonly code: StorageExceptionCode,
    message: string,
    status: number = HttpStatus.INTERNAL_SERVER_ERROR,
    readonly originalCause?: unknown,
  ) {
    super({ code, message }, status);
  }

  /** Create a configuration error. */
  static misconfigured(message: string, cause?: unknown): StorageException {
    return new StorageException(StorageExceptionCode.MISCONFIGURED, message, HttpStatus.INTERNAL_SERVER_ERROR, cause);
  }

  /** Create a file-not-found error. */
  static fileNotFound(message = 'Storage file was not found'): StorageException {
    return new StorageException(StorageExceptionCode.FILE_NOT_FOUND, message, HttpStatus.NOT_FOUND);
  }

  /** Create an upload-not-found error. */
  static uploadNotFound(message = 'Upload was not found'): StorageException {
    return new StorageException(StorageExceptionCode.UPLOAD_NOT_FOUND, message, HttpStatus.NOT_FOUND);
  }

  /** Create an upload-expired error. */
  static uploadExpired(message = 'Upload has expired'): StorageException {
    return new StorageException(StorageExceptionCode.UPLOAD_EXPIRED, message, HttpStatus.GONE);
  }

  /** Create an upload-offset mismatch error. */
  static offsetMismatch(message = 'Upload offset does not match server state'): StorageException {
    return new StorageException(StorageExceptionCode.UPLOAD_OFFSET_MISMATCH, message, HttpStatus.CONFLICT);
  }

  /** Create a checksum mismatch error. */
  static checksumMismatch(message = 'Upload checksum does not match chunk payload'): StorageException {
    return new StorageException(StorageExceptionCode.CHECKSUM_MISMATCH, message, 460);
  }

  /** Create a hook rejection error. */
  static hookRejected(message = 'Storage hook rejected the operation', cause?: unknown): StorageException {
    return new StorageException(StorageExceptionCode.HOOK_REJECTED, message, HttpStatus.FORBIDDEN, cause);
  }

  /** Create an invalid storage key error. */
  static invalidStorageKey(message = 'Invalid storage key'): StorageException {
    return new StorageException(StorageExceptionCode.INVALID_STORAGE_KEY, message, HttpStatus.BAD_REQUEST);
  }

  /** Create a storage driver error. */
  static driver(message: string, cause?: unknown): StorageException {
    return new StorageException(StorageExceptionCode.DRIVER_ERROR, message, HttpStatus.INTERNAL_SERVER_ERROR, cause);
  }
}
