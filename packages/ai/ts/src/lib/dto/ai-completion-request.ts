/**
 * Describes ai completion request values.
 */
export interface AiCompletionRequest {
  prompt: string;
  model?: string;
  system?: string;
  temperature?: number;
  maxOutputTokens?: number;
  metadata?: Record<string, unknown>;
}
