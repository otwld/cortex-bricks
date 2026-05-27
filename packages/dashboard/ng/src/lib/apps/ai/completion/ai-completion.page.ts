import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AiModelAlias } from '@otwld/ts-ai';
import { AiCompletionService, AiModelsService, AiUsageCardComponent } from '@otwld/ng-ai';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

/**
 * Provides ai completion page behavior.
 */
@Component({
  selector: 'app-ai-completion-page',
  imports: [AiUsageCardComponent, ButtonModule, FormsModule, SelectModule, TextareaModule],
  templateUrl: './ai-completion.page.html',
})
export class AiCompletionPage implements OnInit {
  private readonly modelsService = inject(AiModelsService);
  readonly completion = inject(AiCompletionService);

  readonly models = signal<AiModelAlias[]>([]);
  readonly prompt = signal('Write a concise changelog entry for adding AI support.');
  readonly selectedModel = signal('fast');
  readonly modelOptions = computed(() =>
    this.models()
      .filter((model) => model.capabilities.includes('completion'))
      .map((model) => ({ label: model.label ?? model.alias, value: model.alias })),
  );

  /**
   * Runs ng on init.
   */
  async ngOnInit(): Promise<void> {
    this.models.set(await this.modelsService.list());
  }

  /**
   * Runs submit.
   */
  async submit(): Promise<void> {
    const prompt = this.prompt().trim();
    if (!prompt) return;

    await this.completion.complete({ prompt, model: this.selectedModel() });
  }

  /**
   * Runs abort.
   */
  abort(): void {
    this.completion.abort();
  }
}
