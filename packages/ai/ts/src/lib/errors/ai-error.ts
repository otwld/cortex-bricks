/**
 * Enumerates ai error code values.
 */
export enum AiErrorCode {
  MISCONFIGURED = 'misconfigured',
  VALIDATION_FAILED = 'validation_failed',
  MODEL_NOT_ALLOWED = 'model_not_allowed',
  SCHEMA_NOT_FOUND = 'schema_not_found',
  TOOL_NOT_FOUND = 'tool_not_found',
  PROVIDER_FAILED = 'provider_failed',
  STREAM_FAILED = 'stream_failed',
  QUOTA_EXCEEDED = 'quota_exceeded',
  PROMPT_TOKEN_LIMIT_EXCEEDED = 'prompt_token_limit_exceeded',
}

/**
 * Describes ai error response values.
 */
export interface AiErrorResponse {
  code: AiErrorCode;
  message: string;
  details?: unknown;
}
