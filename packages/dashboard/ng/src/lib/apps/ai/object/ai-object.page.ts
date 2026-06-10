import { JsonPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AiModelAlias } from '@otwld/ts-ai';
import { AiModelsService, AiObjectService, AiUsageCardComponent } from '@otwld/ng-ai';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

interface SummaryObject {
  title: string;
  bullets: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

/**
 * Demonstrates structured object generation from dashboard text input.
 */
@Component({
  selector: 'app-ai-object-page',
  imports: [AiUsageCardComponent, ButtonModule, FormsModule, JsonPipe, SelectModule, TextareaModule],
  templateUrl: './ai-object.page.html',
})
export class AiObjectPage implements OnInit {
  private readonly modelsService = inject(AiModelsService);
  private readonly objectService = inject(AiObjectService);

  /**
   * Available AI model aliases loaded from the shared AI models service.
   */
  readonly models = signal<AiModelAlias[]>([]);

  /**
   * Instruction prompt sent to the object generation service.
   */
  readonly prompt = signal('Extract a structured summary from this customer note.');

  /**
   * Source text wrapped into the object generation request input.
   */
  readonly input = signal('Customer likes the new upload flow but wants clearer progress labels.');

  /**
   * Model alias currently selected for structured object generation.
   */
  readonly selectedModel = signal('structured');

  /**
   * Whether an object generation request is currently in flight.
   */
  readonly loading = signal(false);

  /**
   * Last object generation error message shown by the demo.
   */
  readonly error = signal<string | null>(null);

  /**
   * Last structured summary object returned by the AI service.
   */
  readonly result = signal<SummaryObject | null>(null);

  /**
   * Select options for models that support object generation.
   */
  readonly modelOptions = computed(() =>
    this.models()
      .filter((model) => model.capabilities.includes('object'))
      .map((model) => ({ label: model.label ?? model.alias, value: model.alias })),
  );

  /**
   * Loads available AI model metadata for the model selector.
   */
  async ngOnInit(): Promise<void> {
    this.models.set(await this.modelsService.list());
  }

  /**
   * Sends the prompt and input text to the object generation service.
   */
  async submit(): Promise<void> {
    const prompt = this.prompt().trim();
    if (!prompt) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const result = await this.objectService.generate<SummaryObject>('summary', {
        prompt,
        model: this.selectedModel(),
        input: { text: this.input() },
      });
      this.result.set(result);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Object generation failed');
    } finally {
      this.loading.set(false);
    }
  }
}
