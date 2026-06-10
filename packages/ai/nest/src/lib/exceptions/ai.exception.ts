import { HttpException, HttpStatus } from '@nestjs/common';
import { AiErrorCode, AiErrorResponse, AiQuotaUsageBucket } from '@otwld/ts-ai';

/** HTTP exception carrying a stable AI error code and optional details. */
export class AiException extends HttpException {
  /**
   * Create an AI HTTP exception.
   *
   * @param code - Stable shared AI error code.
   * @param message - Human-readable failure message.
   * @param status - HTTP status code for the response.
   * @param details - Optional structured error details.
   * @param cause - Lower-level error that triggered this exception.
   */
  constructor(
    readonly code: AiErrorCode,
    message: string,
    status: HttpStatus,
    readonly details?: unknown,
    cause?: unknown,
  ) {
    super({ code, message, ...(details === undefined ? {} : { details }) }, status, { cause });
    this.name = 'AiException';
  }

  /** Return the typed error payload sent to clients. */
  toResponse(): AiErrorResponse {
    return this.getResponse() as AiErrorResponse;
  }

  /** Create a server-side AI configuration error. */
  static misconfigured(message: string, cause?: unknown): AiException {
    return new AiException(AiErrorCode.MISCONFIGURED, message, HttpStatus.INTERNAL_SERVER_ERROR, cause, cause);
  }

  /** Create a request validation error with parser details. */
  static validationFailed(details: unknown): AiException {
    return new AiException(AiErrorCode.VALIDATION_FAILED, 'AI request validation failed', HttpStatus.BAD_REQUEST, details);
  }

  /** Create an error for an unconfigured model alias. */
  static modelNotAllowed(alias: string): AiException {
    return new AiException(AiErrorCode.MODEL_NOT_ALLOWED, `AI model alias "${alias}" is not configured`, HttpStatus.BAD_REQUEST);
  }

  /** Create an error for a missing object-generation schema. */
  static schemaNotFound(schemaKey: string): AiException {
    return new AiException(AiErrorCode.SCHEMA_NOT_FOUND, `AI object schema "${schemaKey}" is not registered`, HttpStatus.NOT_FOUND);
  }

  /** Create an error for a missing tool registration. */
  static toolNotFound(name: string): AiException {
    return new AiException(AiErrorCode.TOOL_NOT_FOUND, `AI tool "${name}" is not registered`, HttpStatus.NOT_FOUND);
  }

  /** Create an error for a quota bucket that cannot reserve the requested tokens. */
  static quotaExceeded(bucket: AiQuotaUsageBucket, requestedTokens: number): AiException {
    return new AiException(AiErrorCode.QUOTA_EXCEEDED, 'AI token quota exceeded', HttpStatus.TOO_MANY_REQUESTS, { bucket, requestedTokens });
  }

  /** Create an error for prompts that exceed the configured preflight limit. */
  static promptTokenLimitExceeded(estimatedTokens: number, maxPromptTokens: number): AiException {
    return new AiException(AiErrorCode.PROMPT_TOKEN_LIMIT_EXCEEDED, 'AI prompt token limit exceeded', HttpStatus.BAD_REQUEST, {
      estimatedTokens,
      maxPromptTokens,
    });
  }
}
