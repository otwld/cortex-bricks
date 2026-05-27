import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AiModelAlias } from '@otwld/ts-ai';
import { AiAssistAcceptedEvent, AiAssistDirective, AiAssistErrorEvent, AiAssistPrompt, AiModelsService } from '@otwld/ng-ai';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';

interface AssistActivity {
  type: 'accepted' | 'error';
  label: string;
  detail: string;
}

/**
 * Provides ai assist page behavior.
 */
@Component({
  selector: 'app-ai-assist-page',
  imports: [AiAssistDirective, ButtonModule, FormsModule, InputTextModule, SelectModule, TagModule, TextareaModule],
  templateUrl: './ai-assist.page.html',
})
export class AiAssistPage implements OnInit {
  private readonly modelsService = inject(AiModelsService);

  readonly models = signal<AiModelAlias[]>([]);
  readonly selectedModel = signal('fast');
  readonly activity = signal<AssistActivity[]>([]);

  readonly customerName = signal('Maya Chen');
  readonly customerMessage = signal(
    'I tried the new upload flow this morning. It is faster, but I was not sure if the last file was still processing or already failed.',
  );
  readonly supportReply = signal('Thanks for flagging this. I checked the upload logs and can see where the progress state becomes unclear.');

  readonly productName = signal('Atlas Task Board');
  readonly productAudience = signal('operations teams');
  readonly productDescription = signal('A compact planning board for teams that coordinate daily work across support, logistics, and field tasks.');

  readonly profileRole = signal('Customer Success Lead');
  readonly profileTone = signal('confident and approachable');
  readonly profileBio = signal('I help customers turn complex workflows into simple operating habits.');

  readonly modelOptions = computed(() =>
    this.models()
      .filter((model) => model.capabilities.includes('completion'))
      .map((model) => ({ label: model.label ?? model.alias, value: model.alias })),
  );

  readonly supportReplyPrompt: AiAssistPrompt = ({ value }) => ({
    prompt: [
      'Draft a concise customer support reply.',
      'Return only the reply body.',
      `Customer name: ${this.customerName()}`,
      `Customer message: ${this.customerMessage()}`,
      `Current draft: ${value}`,
    ].join('\n\n'),
    system: 'You write precise, warm B2B support replies. Avoid promises that are not stated in the prompt.',
  });

  readonly productDescriptionPrompt: AiAssistPrompt = ({ value }) => ({
    prompt: [
      'Improve this product description for a dashboard product form.',
      'Keep it specific, credible, and under 70 words. Return only the final description.',
      `Product: ${this.productName()}`,
      `Audience: ${this.productAudience()}`,
      `Current description: ${value}`,
    ].join('\n\n'),
    system: 'You write clear product copy for operational software.',
  });

  readonly profileBioPrompt: AiAssistPrompt = ({ selectedText, value }) => ({
    prompt: [
      selectedText ? 'Rewrite the selected part of this profile bio.' : 'Rewrite this profile bio.',
      `Role: ${this.profileRole()}`,
      `Tone: ${this.profileTone()}`,
      `Bio: ${value}`,
      selectedText ? `Selected text: ${selectedText}` : '',
      'Return only replacement text.',
    ]
      .filter(Boolean)
      .join('\n\n'),
    system: 'You write polished professional bios without hype.',
  });

  /**
   * Runs ng on init.
   */
  async ngOnInit(): Promise<void> {
    const models = await this.modelsService.list();
    this.models.set(models);

    const firstCompletionModel = models.find((model) => model.capabilities.includes('completion'));
    if (firstCompletionModel) this.selectedModel.set(firstCompletionModel.alias);
  }

  /**
   * Runs record accepted.
   *
   * @param label - label value.
   *
   * @param event - event value.
   */
  recordAccepted(label: string, event: AiAssistAcceptedEvent): void {
    this.pushActivity({
      type: 'accepted',
      label,
      detail: event.text,
    });
  }

  /**
   * Runs record error.
   *
   * @param label - label value.
   *
   * @param event - event value.
   */
  recordError(label: string, event: AiAssistErrorEvent): void {
    this.pushActivity({
      type: 'error',
      label,
      detail: event.message,
    });
  }

  /**
   * Runs reset demo.
   */
  resetDemo(): void {
    this.customerName.set('Maya Chen');
    this.customerMessage.set(
      'I tried the new upload flow this morning. It is faster, but I was not sure if the last file was still processing or already failed.',
    );
    this.supportReply.set('Thanks for flagging this. I checked the upload logs and can see where the progress state becomes unclear.');
    this.productName.set('Atlas Task Board');
    this.productAudience.set('operations teams');
    this.productDescription.set('A compact planning board for teams that coordinate daily work across support, logistics, and field tasks.');
    this.profileRole.set('Customer Success Lead');
    this.profileTone.set('confident and approachable');
    this.profileBio.set('I help customers turn complex workflows into simple operating habits.');
    this.activity.set([]);
  }

  private pushActivity(activity: AssistActivity): void {
    this.activity.update((items) => [activity, ...items].slice(0, 4));
  }
}
