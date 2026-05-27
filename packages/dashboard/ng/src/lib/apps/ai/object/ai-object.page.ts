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
 * Provides ai object page behavior.
 */
@Component({
  selector: 'app-ai-object-page',
  imports: [AiUsageCardComponent, ButtonModule, FormsModule, JsonPipe, SelectModule, TextareaModule],
  templateUrl: './ai-object.page.html',
})
export class AiObjectPage implements OnInit {
  private readonly modelsService = inject(AiModelsService);
  private readonly objectService = inject(AiObjectService);

  readonly models = signal<AiModelAlias[]>([]);
  readonly prompt = signal('Extract a structured summary from this customer note.');
  readonly input = signal('Customer likes the new upload flow but wants clearer progress labels.');
  readonly selectedModel = signal('structured');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<SummaryObject | null>(null);
  readonly modelOptions = computed(() =>
    this.models()
      .filter((model) => model.capabilities.includes('object'))
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
