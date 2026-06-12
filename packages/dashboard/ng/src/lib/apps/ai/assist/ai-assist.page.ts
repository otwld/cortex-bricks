import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AiModelAlias } from '@otwld/ts-ai';
import { AiAssistAcceptedEvent, AiAssistDirective, AiAssistErrorEvent, AiAssistPrompt, AiModelsService } from '@otwld/ng-ai';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { Card } from 'primeng/card';

interface AssistActivity {
  type: 'accepted' | 'error';
  label: string;
  detail: string;
}

/** Demo page for applying AI assist prompts to editable form fields. */
@Component({
  selector: 'app-ai-assist-page',
  imports: [AiAssistDirective, ButtonModule, FormsModule, InputTextModule, SelectModule, TagModule, TextareaModule, Card],
  templateUrl: './ai-assist.page.html',
})
export class AiAssistPage implements OnInit {
  private readonly modelsService = inject(AiModelsService);

  /**
   * Available AI model aliases loaded from the shared AI models service.
   */
  readonly models = signal<AiModelAlias[]>([]);

  /**
   * Model alias currently selected for assist completions.
   */
  readonly selectedModel = signal('fast');

  /**
   * Recent accepted and failed assist operations shown in the activity list.
   */
  readonly activity = signal<AssistActivity[]>([]);

  /**
   * Customer name inserted into the support reply prompt.
   */
  readonly customerName = signal('Maya Chen');

  /**
   * Customer message used as source context for the support reply prompt.
   */
  readonly customerMessage = signal(
    'I tried the new upload flow this morning. It is faster, but I was not sure if the last file was still processing or already failed.',
  );

  /**
   * Draft support reply edited by the AI assist directive.
   */
  readonly supportReply = signal('Thanks for flagging this. I checked the upload logs and can see where the progress state becomes unclear.');

  /**
   * Product name inserted into the product-description prompt.
   */
  readonly productName = signal('Atlas Task Board');

  /**
   * Audience description used to keep generated product copy specific.
   */
  readonly productAudience = signal('operations teams');

  /**
   * Draft product description edited by the AI assist directive.
   */
  readonly productDescription = signal('A compact planning board for teams that coordinate daily work across support, logistics, and field tasks.');

  /**
   * Profile role used by the profile-bio rewrite prompt.
   */
  readonly profileRole = signal('Customer Success Lead');

  /**
   * Desired profile tone used by the profile-bio rewrite prompt.
   */
  readonly profileTone = signal('confident and approachable');

  /**
   * Draft profile biography edited by the AI assist directive.
   */
  readonly profileBio = signal('I help customers turn complex workflows into simple operating habits.');

  /**
   * Select options for models that support completion requests.
   */
  readonly modelOptions = computed(() =>
    this.models()
      .filter((model) => model.capabilities.includes('completion'))
      .map((model) => ({ label: model.label ?? model.alias, value: model.alias })),
  );

  /**
   * Prompt builder for rewriting the support reply while preserving customer context.
   */
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

  /**
   * Prompt builder for tightening product copy for an operational dashboard product.
   */
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

  /**
   * Prompt builder for rewriting a full profile bio or the current text selection.
   */
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
   * Loads available models and selects the first model that can perform completions.
   */
  async ngOnInit(): Promise<void> {
    const models = await this.modelsService.list();
    this.models.set(models);

    const firstCompletionModel = models.find((model) => model.capabilities.includes('completion'));
    if (firstCompletionModel) this.selectedModel.set(firstCompletionModel.alias);
  }

  /**
   * Records accepted assist output in the visible activity feed.
   *
   * @param label - Demo section label associated with the assist action.
   * @param event - Accepted assist event emitted by the directive.
   */
  recordAccepted(label: string, event: AiAssistAcceptedEvent): void {
    this.pushActivity({
      type: 'accepted',
      label,
      detail: event.text,
    });
  }

  /**
   * Records failed assist output in the visible activity feed.
   *
   * @param label - Demo section label associated with the assist action.
   * @param event - Error event emitted by the directive.
   */
  recordError(label: string, event: AiAssistErrorEvent): void {
    this.pushActivity({
      type: 'error',
      label,
      detail: event.message,
    });
  }

  /**
   * Restores all demo fields and clears the assist activity feed.
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
