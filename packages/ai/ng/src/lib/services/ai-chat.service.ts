import { inject, Injectable } from '@angular/core';
import { Chat } from '@ai-sdk/angular';
import { AiChatRequest } from '@otwld/ts-ai';
import { DefaultChatTransport } from 'ai';
import { AI_CONFIG } from '../tokens/ai-config.token';

/**
 * Provides ai chat service behavior.
 */
@Injectable({ providedIn: 'root' })
export class AiChatService {
  private readonly config = inject(AI_CONFIG);

  /**
   * Runs create chat.
   *
   * @param initialRequest - initial request value.
   *
   * @returns The ai chat service create chat result.
   */
  createChat(initialRequest: Partial<Omit<AiChatRequest, 'messages'>> = {}): Chat {
    return new Chat({
      transport: new DefaultChatTransport({
        api: `${this.config.apiBaseUrl}/chat`,
        credentials: this.config.credentials,
        prepareSendMessagesRequest: ({ api, body, credentials, headers, messages }) => ({
          api,
          credentials,
          headers,
          body: {
            ...this.removeUndefined(initialRequest),
            ...this.removeUndefined(body),
            messages,
          },
        }),
      }),
    });
  }

  private removeUndefined(value: object | undefined): Record<string, unknown> {
    if (!value) return {};
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
  }
}
