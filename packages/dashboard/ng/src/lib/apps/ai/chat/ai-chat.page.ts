import { Component, OnInit, computed, inject, signal, type WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AiModelAlias } from '@otwld/ts-ai';
import { AiChatService, AiModelsService, AiUsageCardComponent } from '@otwld/ng-ai';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { Card } from 'primeng/card';

interface AiChatDisplayPart {
  type: string;
  text?: string;
  state?: string;
  input?: unknown;
  output?: unknown;
}

interface AiChatDisplayMessage {
  id?: string;
  role: string;
  parts: AiChatDisplayPart[];
}

/**
 * Demonstrates model-backed AI chat with visible text and tool message parts.
 */
@Component({
  selector: 'app-ai-chat-page',
  imports: [AiUsageCardComponent, ButtonModule, FormsModule, SelectModule, TextareaModule, Card],
  templateUrl: './ai-chat.page.html',
})
export class AiChatPage implements OnInit {
  private readonly chatService = inject(AiChatService);
  private readonly modelsService = inject(AiModelsService);

  /**
   * Available AI model aliases loaded from the shared AI models service.
   */
  readonly models = signal<AiModelAlias[]>([]);

  /**
   * Draft user message bound to the chat input.
   */
  readonly input = signal('Explain the AI package architecture in three bullets.');

  /**
   * Model alias currently selected for chat requests.
   */
  readonly selectedModel = signal('chat');

  /**
   * Active chat session created for the selected model.
   */
  readonly chat: WritableSignal<ReturnType<AiChatService['createChat']>> = signal(this.chatService.createChat({ model: this.selectedModel() }));

  /**
   * Select options for models that support chat requests.
   */
  readonly modelOptions = computed(() =>
    this.models()
      .filter((model) => model.capabilities.includes('chat'))
      .map((model) => ({ label: model.label ?? model.alias, value: model.alias })),
  );

  /**
   * Loads available AI model metadata for the model selector.
   */
  async ngOnInit(): Promise<void> {
    this.models.set(await this.modelsService.list());
  }

  /**
   * Switches the selected model and starts a fresh chat session.
   *
   * @param model - Model alias to use for subsequent chat messages.
   */
  selectModel(model: string): void {
    this.selectedModel.set(model);
    this.chat.set(this.chatService.createChat({ model }));
  }

  /**
   * Sends the current input text to the active chat and clears the draft.
   */
  async send(): Promise<void> {
    const text = this.input().trim();
    if (!text) return;

    await this.chat().sendMessage({ text });
    this.input.set('');
  }

  /**
   * Requests cancellation of the active chat response.
   */
  stop(): void {
    void this.chat().stop();
  }

  /**
   * Returns chat messages that contain visible text or tool parts.
   *
   * @returns Messages with at least one visible part.
   */
  visibleMessages(): AiChatDisplayMessage[] {
    return this.chat().messages.filter((message) => this.visibleParts(message).length > 0);
  }

  /**
   * Filters message parts to those rendered by the demo.
   *
   * @param message - Chat message to inspect.
   * @returns Text and tool parts shown in the UI.
   */
  visibleParts(message: AiChatDisplayMessage): AiChatDisplayPart[] {
    return message.parts.filter((part) => part.type === 'text' || part.type.startsWith('tool-'));
  }

  /**
   * Determines whether a message part represents a tool invocation.
   *
   * @param part - Message part to inspect.
   * @returns True when the part type starts with `tool-`.
   */
  isToolPart(part: AiChatDisplayPart): boolean {
    return part.type.startsWith('tool-');
  }

  /**
   * Extracts the tool name from a tool message part type.
   *
   * @param part - Tool message part to inspect.
   * @returns Tool name without the `tool-` prefix.
   */
  toolName(part: AiChatDisplayPart): string {
    return part.type.replace(/^tool-/, '');
  }

  /**
   * Formats tool input or output payload for display.
   *
   * @param part - Tool message part to inspect.
   * @returns Pretty-printed JSON payload.
   */
  toolPayload(part: AiChatDisplayPart): string {
    const payload = part.output ?? part.input ?? {};
    return JSON.stringify(payload, null, 2);
  }
}
