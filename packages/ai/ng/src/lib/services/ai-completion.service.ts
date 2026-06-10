import { Injectable, inject, signal } from '@angular/core';
import { Completion } from '@ai-sdk/angular';
import { AiCompletionRequest, AiErrorCode } from '@otwld/ts-ai';
import { AiClientError } from '../errors/ai-client-error';
import { AI_CONFIG } from '../tokens/ai-config.token';

/** Completion session surface used by AI completion consumers. */
export interface AiCompletionSession {
  /** Current streamed text. */
  completion: string;
  /** Most recent completion error from the provider SDK. */
  readonly error: Error | undefined;
  /** Whether a completion request is currently active. */
  readonly loading: boolean;
  /** Send a prompt and resolve with the final generated text when available. */
  complete(prompt: string): Promise<string | null | undefined>;
  /** Abort the active completion request. */
  stop(): void;
}

/** Angular client for streamed AI text completions. */
@Injectable({ providedIn: 'root' })
export class AiCompletionService {
  private readonly config = inject(AI_CONFIG);
  private completion: AiCompletionSession | null = null;

  /** Current streamed completion text. */
  readonly text = signal('');

  /** Whether the completion request is currently active. */
  readonly loading = signal(false);

  /** Most recent completion client error. */
  readonly error = signal<AiClientError | null>(null);

  /** Create a low-level completion instance with shared request defaults. */
  createCompletion(initialRequest: Partial<Omit<AiCompletionRequest, 'prompt'>> = {}): AiCompletionSession {
    return new Completion({
      api: `${this.config.apiBaseUrl}/completion`,
      credentials: this.config.credentials,
      streamProtocol: 'text',
      body: this.removeUndefined(initialRequest),
    });
  }

  /** Stream a completion request and mirror its state through Angular signals. */
  async complete(request: AiCompletionRequest): Promise<string> {
    const completion = this.createCompletion(this.requestOptions(request));
    this.completion = completion;
    this.text.set('');
    this.loading.set(true);
    this.error.set(null);

    const syncInterval = setInterval(() => this.sync(completion), 50);

    try {
      const result = await completion.complete(request.prompt);
      this.sync(completion);
      if (completion.error) throw new AiClientError(AiErrorCode.STREAM_FAILED, completion.error.message, completion.error);
      return result ?? completion.completion;
    } catch (error) {
      const clientError =
        error instanceof AiClientError ? error : new AiClientError(AiErrorCode.STREAM_FAILED, 'Completion stream failed', error);
      this.error.set(clientError);
      throw clientError;
    } finally {
      clearInterval(syncInterval);
      this.sync(completion);
      this.loading.set(false);
    }
  }

  /** Stop the active completion stream, if one exists. */
  abort(): void {
    this.completion?.stop();
    this.loading.set(false);
  }

  private sync(completion: AiCompletionSession): void {
    this.text.set(completion.completion);
    this.loading.set(completion.loading);
    this.error.set(completion.error ? new AiClientError(AiErrorCode.STREAM_FAILED, completion.error.message, completion.error) : null);
  }

  private requestOptions(request: AiCompletionRequest): Partial<Omit<AiCompletionRequest, 'prompt'>> {
    return {
      maxOutputTokens: request.maxOutputTokens,
      metadata: request.metadata,
      model: request.model,
      system: request.system,
      temperature: request.temperature,
    };
  }

  private removeUndefined(value: object): Record<string, unknown> {
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
  }
}
