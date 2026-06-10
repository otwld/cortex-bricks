import { Inject, Injectable } from '@nestjs/common';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';
import { AiModelAlias } from '@otwld/ts-ai';
import { AI_MODULE_OPTIONS, NormalizedAiModuleOptions } from '../config/ai-module-options';
import { AiException } from '../exceptions/ai.exception';

/** Resolves configured model aliases to concrete AI SDK language models. */
@Injectable()
export class AiProviderRegistryService {
  private readonly openai = this.options.providers.openai
    ? createOpenAI({
        apiKey: this.options.providers.openai.apiKey,
        baseURL: this.options.providers.openai.baseURL,
      })
    : null;

  /**
   * Create the AI provider registry.
   *
   * @param options - Normalized AI module options containing provider and model aliases.
   */
  constructor(@Inject(AI_MODULE_OPTIONS) private readonly options: NormalizedAiModuleOptions) {}

  /** List public model aliases and their capabilities. */
  listModels(): AiModelAlias[] {
    return Object.entries(this.options.models).map(([alias, model]) => ({
      alias,
      providerModel: model.providerModel,
      capabilities: model.capabilities,
      ...(model.label ? { label: model.label } : {}),
    }));
  }

  /** Resolve a public model alias to its provider-prefixed model reference. */
  resolveModelReference(alias = 'chat'): string {
    const model = this.options.models[alias];
    if (!model) throw AiException.modelNotAllowed(alias);
    return model.providerModel;
  }

  /** Resolve a public model alias to an AI SDK language model instance. */
  resolveLanguageModel(alias = 'chat'): LanguageModel {
    const reference = this.resolveModelReference(alias);
    const separatorIndex = reference.indexOf(':');
    const provider = reference.slice(0, separatorIndex);
    const modelId = reference.slice(separatorIndex + 1);

    if (provider === 'openai' && this.openai) return this.openai(modelId);

    throw AiException.misconfigured(`AI provider "${provider}" is not configured`);
  }
}
