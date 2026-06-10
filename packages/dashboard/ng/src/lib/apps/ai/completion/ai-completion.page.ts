import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AiModelAlias } from '@otwld/ts-ai';
import { AiCompletionService, AiModelsService, AiUsageCardComponent } from '@otwld/ng-ai';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

/**
 * Demonstrates one-shot AI text completion with model selection and cancellation.
 */
@Component({
  selector: 'app-ai-completion-page',
  imports: [AiUsageCardComponent, ButtonModule, FormsModule, SelectModule, TextareaModule],
  templateUrl: './ai-completion.page.html',
})
export class AiCompletionPage implements OnInit {
  private readonly modelsService = inject(AiModelsService);

  /**
   * Completion request state and actions shared with the template.
   */
  readonly completion = inject(AiCompletionService);

  /**
   * Available AI model aliases loaded from the shared AI models service.
   */
  readonly models = signal<AiModelAlias[]>([]);

  /**
   * Prompt text sent to the completion service.
   */
  readonly prompt = signal('Write a concise changelog entry for adding AI support.');

  /**
   * Model alias currently selected for completion requests.
   */
  readonly selectedModel = signal('fast');

  /**
   * Select options for models that support completion requests.
   */
  readonly modelOptions = computed(() =>
    this.models()
      .filter((model) => model.capabilities.includes('completion'))
      .map((model) => ({ label: model.label ?? model.alias, value: model.alias })),
  );

  /**
   * Loads available AI model metadata for the model selector.
   */
  async ngOnInit(): Promise<void> {
    this.models.set(await this.modelsService.list());
  }

  /**
   * Sends the current prompt to the completion service.
   */
  async submit(): Promise<void> {
    const prompt = this.prompt().trim();
    if (!prompt) return;

    await this.completion.complete({ prompt, model: this.selectedModel() });
  }

  /**
   * Cancels the active completion request when one is in flight.
   */
  abort(): void {
    this.completion.abort();
  }
}
