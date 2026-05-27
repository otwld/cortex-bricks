/**
 * Describes ai object request values.
 */
export interface AiObjectRequest {
  prompt: string;
  model?: string;
  system?: string;
  input?: Record<string, unknown>;
  temperature?: number;
  maxOutputTokens?: number;
  metadata?: Record<string, unknown>;
}
