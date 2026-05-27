import { AiMessage } from '../models/ai-message';

/**
 * Describes ai chat request values.
 */
export interface AiChatRequest {
  messages: AiMessage[];
  model?: string;
  system?: string;
  temperature?: number;
  maxOutputTokens?: number;
  metadata?: Record<string, unknown>;
}
