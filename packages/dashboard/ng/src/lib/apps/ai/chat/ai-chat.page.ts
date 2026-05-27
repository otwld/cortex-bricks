import { Component, OnInit, computed, inject, signal, type WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AiModelAlias } from '@otwld/ts-ai';
import { AiChatService, AiModelsService, AiUsageCardComponent } from '@otwld/ng-ai';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

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
 * Provides ai chat page behavior.
 */
@Component({
  selector: 'app-ai-chat-page',
  imports: [AiUsageCardComponent, ButtonModule, FormsModule, SelectModule, TextareaModule],
  templateUrl: './ai-chat.page.html',
})
export class AiChatPage implements OnInit {
  private readonly chatService = inject(AiChatService);
  private readonly modelsService = inject(AiModelsService);

  readonly models = signal<AiModelAlias[]>([]);
  readonly input = signal('Explain the AI package architecture in three bullets.');
  readonly selectedModel = signal('chat');
  readonly chat: WritableSignal<ReturnType<AiChatService['createChat']>> = signal(this.chatService.createChat({ model: this.selectedModel() }));
  readonly modelOptions = computed(() =>
    this.models()
      .filter((model) => model.capabilities.includes('chat'))
      .map((model) => ({ label: model.label ?? model.alias, value: model.alias })),
  );

  /**
   * Runs ng on init.
   */
  async ngOnInit(): Promise<void> {
    this.models.set(await this.modelsService.list());
  }

  /**
   * Runs select model.
   *
   * @param model - model value.
   */
  selectModel(model: string): void {
    this.selectedModel.set(model);
    this.chat.set(this.chatService.createChat({ model }));
  }

  /**
   * Runs send.
   */
  async send(): Promise<void> {
    const text = this.input().trim();
    if (!text) return;

    await this.chat().sendMessage({ text });
    this.input.set('');
  }

  /**
   * Runs stop.
   */
  stop(): void {
    void this.chat().stop();
  }

  /**
   * Runs visible messages.
   *
   * @returns The ai chat page visible messages result.
   */
  visibleMessages(): AiChatDisplayMessage[] {
    return this.chat().messages.filter((message) => this.visibleParts(message).length > 0);
  }

  /**
   * Runs visible parts.
   *
   * @param message - message value.
   *
   * @returns The ai chat page visible parts result.
   */
  visibleParts(message: AiChatDisplayMessage): AiChatDisplayPart[] {
    return message.parts.filter((part) => part.type === 'text' || part.type.startsWith('tool-'));
  }

  /**
   * Runs is tool part.
   *
   * @param part - part value.
   *
   * @returns The ai chat page is tool part result.
   */
  isToolPart(part: AiChatDisplayPart): boolean {
    return part.type.startsWith('tool-');
  }

  /**
   * Runs tool name.
   *
   * @param part - part value.
   *
   * @returns The ai chat page tool name result.
   */
  toolName(part: AiChatDisplayPart): string {
    return part.type.replace(/^tool-/, '');
  }

  /**
   * Runs tool payload.
   *
   * @param part - part value.
   *
   * @returns The ai chat page tool payload result.
   */
  toolPayload(part: AiChatDisplayPart): string {
    const payload = part.output ?? part.input ?? {};
    return JSON.stringify(payload, null, 2);
  }
}
