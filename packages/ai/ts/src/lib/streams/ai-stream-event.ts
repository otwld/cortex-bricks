import { AiUsage } from '../models/ai-usage';

/**
 * Represents ai stream event type.
 */
export type AiStreamEventType = 'start' | 'delta' | 'finish' | 'error';

/**
 * Describes ai stream event values.
 */
export interface AiStreamEvent {
  type: AiStreamEventType;
  text?: string;
  usage?: AiUsage;
  error?: string;
  metadata?: Record<string, unknown>;
}
