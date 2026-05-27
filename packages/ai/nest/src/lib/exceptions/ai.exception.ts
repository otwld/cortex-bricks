import { HttpException, HttpStatus } from '@nestjs/common';
import { AiErrorCode, AiErrorResponse, AiQuotaUsageBucket } from '@otwld/ts-ai';

/**
 * Provides ai exception behavior.
 */
export class AiException extends HttpException {
  /**
   * Creates a ai exception instance.
   *
   * @param code - code value.
   *
   * @param message - message value.
   *
   * @param status - status value.
   *
   * @param details - details value.
   *
   * @param cause - cause value.
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

  /**
   * Runs to response.
   *
   * @returns The ai exception to response result.
   */
  toResponse(): AiErrorResponse {
    return this.getResponse() as AiErrorResponse;
  }

  /**
   * Runs misconfigured.
   *
   * @param message - message value.
   *
   * @param cause - cause value.
   *
   * @returns The ai exception misconfigured result.
   */
  static misconfigured(message: string, cause?: unknown): AiException {
    return new AiException(AiErrorCode.MISCONFIGURED, message, HttpStatus.INTERNAL_SERVER_ERROR, cause, cause);
  }

  /**
   * Runs validation failed.
   *
   * @param details - details value.
   *
   * @returns The ai exception validation failed result.
   */
  static validationFailed(details: unknown): AiException {
    return new AiException(AiErrorCode.VALIDATION_FAILED, 'AI request validation failed', HttpStatus.BAD_REQUEST, details);
  }

  /**
   * Runs model not allowed.
   *
   * @param alias - alias value.
   *
   * @returns The ai exception model not allowed result.
   */
  static modelNotAllowed(alias: string): AiException {
    return new AiException(AiErrorCode.MODEL_NOT_ALLOWED, `AI model alias "${alias}" is not configured`, HttpStatus.BAD_REQUEST);
  }

  /**
   * Runs schema not found.
   *
   * @param schemaKey - schema key value.
   *
   * @returns The ai exception schema not found result.
   */
  static schemaNotFound(schemaKey: string): AiException {
    return new AiException(AiErrorCode.SCHEMA_NOT_FOUND, `AI object schema "${schemaKey}" is not registered`, HttpStatus.NOT_FOUND);
  }

  /**
   * Runs tool not found.
   *
   * @param name - name value.
   *
   * @returns The ai exception tool not found result.
   */
  static toolNotFound(name: string): AiException {
    return new AiException(AiErrorCode.TOOL_NOT_FOUND, `AI tool "${name}" is not registered`, HttpStatus.NOT_FOUND);
  }

  /**
   * Runs quota exceeded.
   *
   * @param bucket - bucket value.
   *
   * @param requestedTokens - requested tokens value.
   *
   * @returns The ai exception quota exceeded result.
   */
  static quotaExceeded(bucket: AiQuotaUsageBucket, requestedTokens: number): AiException {
    return new AiException(AiErrorCode.QUOTA_EXCEEDED, 'AI token quota exceeded', HttpStatus.TOO_MANY_REQUESTS, { bucket, requestedTokens });
  }

  /**
   * Runs prompt token limit exceeded.
   *
   * @param estimatedTokens - estimated tokens value.
   *
   * @param maxPromptTokens - max prompt tokens value.
   *
   * @returns The ai exception prompt token limit exceeded result.
   */
  static promptTokenLimitExceeded(estimatedTokens: number, maxPromptTokens: number): AiException {
    return new AiException(AiErrorCode.PROMPT_TOKEN_LIMIT_EXCEEDED, 'AI prompt token limit exceeded', HttpStatus.BAD_REQUEST, {
      estimatedTokens,
      maxPromptTokens,
    });
  }
}
