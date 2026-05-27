/**
 * Represents ai message role.
 */
export type AiMessageRole = 'system' | 'user' | 'assistant' | 'tool';

/**
 * Describes ai message part values.
 */
export interface AiMessagePart {
  type: string;
  [key: string]: unknown;
}

/**
 * Describes ai message values.
 */
export interface AiMessage {
  id?: string;
  role: AiMessageRole;
  content?: string;
  parts?: AiMessagePart[];
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}
