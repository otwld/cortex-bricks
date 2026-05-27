import { Inject, Injectable } from '@nestjs/common';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';
import { AiModelAlias } from '@otwld/ts-ai';
import { AI_MODULE_OPTIONS, NormalizedAiModuleOptions } from '../config/ai-module-options';
import { AiException } from '../exceptions/ai.exception';

/**
 * Provides ai provider registry service behavior.
 */
@Injectable()
export class AiProviderRegistryService {
  private readonly openai = this.options.providers.openai
    ? createOpenAI({
        apiKey: this.options.providers.openai.apiKey,
        baseURL: this.options.providers.openai.baseURL,
      })
    : null;

  /**
   * Creates a ai provider registry service instance.
   *
   * @param options - options value.
   */
  constructor(@Inject(AI_MODULE_OPTIONS) private readonly options: NormalizedAiModuleOptions) {}

  /**
   * Runs list models.
   *
   * @returns The ai provider registry service list models result.
   */
  listModels(): AiModelAlias[] {
    return Object.entries(this.options.models).map(([alias, model]) => ({
      alias,
      providerModel: model.providerModel,
      capabilities: model.capabilities,
      ...(model.label ? { label: model.label } : {}),
    }));
  }

  /**
   * Runs resolve model reference.
   *
   * @param alias - alias value.
   *
   * @returns The ai provider registry service resolve model reference result.
   *
   * @throws When the operation cannot be completed.
   */
  resolveModelReference(alias = 'chat'): string {
    const model = this.options.models[alias];
    if (!model) throw AiException.modelNotAllowed(alias);
    return model.providerModel;
  }

  /**
   * Runs resolve language model.
   *
   * @param alias - alias value.
   *
   * @returns The ai provider registry service resolve language model result.
   *
   * @throws When the operation cannot be completed.
   */
  resolveLanguageModel(alias = 'chat'): LanguageModel {
    const reference = this.resolveModelReference(alias);
    const separatorIndex = reference.indexOf(':');
    const provider = reference.slice(0, separatorIndex);
    const modelId = reference.slice(separatorIndex + 1);

    if (provider === 'openai' && this.openai) return this.openai(modelId);

    throw AiException.misconfigured(`AI provider "${provider}" is not configured`);
  }
}
