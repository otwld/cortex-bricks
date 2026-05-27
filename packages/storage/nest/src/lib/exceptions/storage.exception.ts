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
  /** Create a storage exception with a stable code and HTTP status. */
  /**
   * Creates a storage exception instance.
   *
   * @param code - code value.
   *
   * @param message - message value.
   *
   * @param status - status value.
   *
   * @param originalCause - original cause value.
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
  /**
   * Runs misconfigured.
   *
   * @param message - message value.
   *
   * @param cause - cause value.
   *
   * @returns The storage exception misconfigured result.
   */
  static misconfigured(message: string, cause?: unknown): StorageException {
    return new StorageException(StorageExceptionCode.MISCONFIGURED, message, HttpStatus.INTERNAL_SERVER_ERROR, cause);
  }

  /** Create a file-not-found error. */
  /**
   * Runs file not found.
   *
   * @param message - message value.
   *
   * @returns The storage exception file not found result.
   */
  static fileNotFound(message = 'Storage file was not found'): StorageException {
    return new StorageException(StorageExceptionCode.FILE_NOT_FOUND, message, HttpStatus.NOT_FOUND);
  }

  /** Create an upload-not-found error. */
  /**
   * Runs upload not found.
   *
   * @param message - message value.
   *
   * @returns The storage exception upload not found result.
   */
  static uploadNotFound(message = 'Upload was not found'): StorageException {
    return new StorageException(StorageExceptionCode.UPLOAD_NOT_FOUND, message, HttpStatus.NOT_FOUND);
  }

  /** Create an upload-expired error. */
  /**
   * Runs upload expired.
   *
   * @param message - message value.
   *
   * @returns The storage exception upload expired result.
   */
  static uploadExpired(message = 'Upload has expired'): StorageException {
    return new StorageException(StorageExceptionCode.UPLOAD_EXPIRED, message, HttpStatus.GONE);
  }

  /** Create an upload-offset mismatch error. */
  /**
   * Runs offset mismatch.
   *
   * @param message - message value.
   *
   * @returns The storage exception offset mismatch result.
   */
  static offsetMismatch(message = 'Upload offset does not match server state'): StorageException {
    return new StorageException(StorageExceptionCode.UPLOAD_OFFSET_MISMATCH, message, HttpStatus.CONFLICT);
  }

  /** Create a checksum mismatch error. */
  /**
   * Runs checksum mismatch.
   *
   * @param message - message value.
   *
   * @returns The storage exception checksum mismatch result.
   */
  static checksumMismatch(message = 'Upload checksum does not match chunk payload'): StorageException {
    return new StorageException(StorageExceptionCode.CHECKSUM_MISMATCH, message, 460);
  }

  /** Create a hook rejection error. */
  /**
   * Runs hook rejected.
   *
   * @param message - message value.
   *
   * @param cause - cause value.
   *
   * @returns The storage exception hook rejected result.
   */
  static hookRejected(message = 'Storage hook rejected the operation', cause?: unknown): StorageException {
    return new StorageException(StorageExceptionCode.HOOK_REJECTED, message, HttpStatus.FORBIDDEN, cause);
  }

  /** Create an invalid storage key error. */
  /**
   * Runs invalid storage key.
   *
   * @param message - message value.
   *
   * @returns The storage exception invalid storage key result.
   */
  static invalidStorageKey(message = 'Invalid storage key'): StorageException {
    return new StorageException(StorageExceptionCode.INVALID_STORAGE_KEY, message, HttpStatus.BAD_REQUEST);
  }

  /** Create a storage driver error. */
  /**
   * Runs driver.
   *
   * @param message - message value.
   *
   * @param cause - cause value.
   *
   * @returns The storage exception driver result.
   */
  static driver(message: string, cause?: unknown): StorageException {
    return new StorageException(StorageExceptionCode.DRIVER_ERROR, message, HttpStatus.INTERNAL_SERVER_ERROR, cause);
  }
}
