import { inject, Injectable } from '@angular/core';
import { Chat } from '@ai-sdk/angular';
import { AiChatRequest } from '@otwld/ts-ai';
import { DefaultChatTransport } from 'ai';
import { AI_CONFIG } from '../tokens/ai-config.token';

/** Angular client for streamed AI chat sessions. */
@Injectable({ providedIn: 'root' })
export class AiChatService {
  private readonly config = inject(AI_CONFIG);

  /** Create a chat instance that sends messages to the configured backend endpoint. */
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
