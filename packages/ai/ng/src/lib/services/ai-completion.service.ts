import { Injectable, inject, signal } from '@angular/core';
import { Completion } from '@ai-sdk/angular';
import { AiCompletionRequest, AiErrorCode } from '@otwld/ts-ai';
import { AiClientError } from '../errors/ai-client-error';
import { AI_CONFIG } from '../tokens/ai-config.token';

/**
 * Provides ai completion service behavior.
 */
@Injectable({ providedIn: 'root' })
export class AiCompletionService {
  private readonly config = inject(AI_CONFIG);
  private completion: Completion | null = null;

  readonly text = signal('');
  readonly loading = signal(false);
  readonly error = signal<AiClientError | null>(null);

  /**
   * Runs create completion.
   *
   * @param initialRequest - initial request value.
   *
   * @returns The ai completion service create completion result.
   */
  createCompletion(initialRequest: Partial<Omit<AiCompletionRequest, 'prompt'>> = {}): Completion {
    return new Completion({
      api: `${this.config.apiBaseUrl}/completion`,
      credentials: this.config.credentials,
      streamProtocol: 'text',
      body: this.removeUndefined(initialRequest),
    });
  }

  /**
   * Runs complete.
   *
   * @param request - request value.
   *
   * @returns The ai completion service complete result.
   *
   * @throws When the operation cannot be completed.
   */
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

  /**
   * Runs abort.
   */
  abort(): void {
    this.completion?.stop();
    this.loading.set(false);
  }

  private sync(completion: Completion): void {
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
