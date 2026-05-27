/**
 * Describes ai usage values.
 */
export interface AiUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

/**
 * Describes ai source values.
 */
export interface AiSource {
  title?: string;
  url?: string;
  providerMetadata?: Record<string, unknown>;
}
