import { AiCompletionRequest } from '@otwld/ts-ai';

/**
 * Represents ai assist apply mode.
 */
export type AiAssistApplyMode = 'replace' | 'selection' | 'append';

/**
 * Describes ai assist context values.
 */
export interface AiAssistContext {
  readonly element: HTMLElement;
  readonly value: string;
  readonly selectedText: string;
  readonly selectionStart: number | null;
  readonly selectionEnd: number | null;
}

/**
 * Represents ai assist prompt result.
 */
export type AiAssistPromptResult = string | Partial<AiCompletionRequest>;

/**
 * Represents ai assist prompt factory.
 */
export type AiAssistPromptFactory = (context: AiAssistContext) => AiAssistPromptResult | Promise<AiAssistPromptResult>;

/**
 * Represents ai assist prompt.
 */
export type AiAssistPrompt = AiAssistPromptResult | AiAssistPromptFactory;

/**
 * Describes ai assist generated event values.
 */
export interface AiAssistGeneratedEvent {
  readonly context: AiAssistContext;
  readonly request: AiCompletionRequest;
  readonly text: string;
}

/**
 * Describes ai assist accepted event values.
 */
export interface AiAssistAcceptedEvent extends AiAssistGeneratedEvent {
  readonly previousValue: string;
  readonly value: string;
}

/**
 * Describes ai assist canceled event values.
 */
export interface AiAssistCanceledEvent {
  readonly context: AiAssistContext;
  readonly generatedText: string | null;
}

/**
 * Describes ai assist error event values.
 */
export interface AiAssistErrorEvent {
  readonly context: AiAssistContext;
  readonly error: unknown;
  readonly message: string;
  readonly request: AiCompletionRequest | null;
}
