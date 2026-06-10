import { inject, Injectable } from '@angular/core';
import { Chat } from '@ai-sdk/angular';
import { AiChatRequest } from '@otwld/ts-ai';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { AI_CONFIG } from '../tokens/ai-config.token';

/** Input used to prepare an AI SDK chat transport request. */
export interface AiChatSendMessagesRequest {
  /** Chat API endpoint. */
  api: string;
  /** Optional body values supplied by the caller. */
  body?: object;
  /** Fetch credentials mode. */
  credentials?: RequestCredentials;
  /** Request headers forwarded to the transport. */
  headers?: HeadersInit;
  /** UI messages to send unchanged to the backend. */
  messages: readonly UIMessage[];
}

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
        prepareSendMessagesRequest: (request) => this.prepareSendMessagesRequest(initialRequest, request),
      }),
    });
  }

  /** Merge static chat options, per-request body values, and raw UI messages. */
  prepareSendMessagesRequest(
    initialRequest: Partial<Omit<AiChatRequest, 'messages'>>,
    request: AiChatSendMessagesRequest,
  ): {
    api: string;
    credentials?: RequestCredentials;
    headers?: HeadersInit;
    body: Record<string, unknown>;
  } {
    return {
      api: request.api,
      credentials: request.credentials,
      headers: request.headers,
      body: {
        ...this.removeUndefined(initialRequest),
        ...this.removeUndefined(request.body),
        messages: request.messages,
      },
    };
  }

  private removeUndefined(value: object | undefined): Record<string, unknown> {
    if (!value) return {};
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
  }
}
