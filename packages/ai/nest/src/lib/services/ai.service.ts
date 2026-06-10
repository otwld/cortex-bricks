import { Inject, Injectable } from '@nestjs/common';
import {
  convertToModelMessages,
  generateObject,
  generateText,
  stepCountIs,
  streamText,
  tool,
  zodSchema,
  type FileUIPart,
  type GenerateObjectResult,
  type Schema,
  type StopCondition,
  type TextUIPart,
  type ToolSet,
  type UIMessage,
} from 'ai';
import type { ZodTypeAny } from 'zod';
import { AiChatRequest, AiCompletionRequest, AiMessagePart, AiObjectRequest } from '@otwld/ts-ai';
import { AI_ENDPOINT_OPTIONS, NormalizedAiEndpointOptions } from '../config/ai-module-options';
import { AiProviderRegistryService } from '../providers/ai-provider-registry.service';
import { AiObjectSchemaRegistry } from '../schemas/ai-object-schema.registry';
import { AiToolRegistry } from '../tools/ai-tool.registry';

type AiTextStreamResult = ReturnType<typeof streamText>;
type AiTextResult = Awaited<ReturnType<typeof generateText>>;
type AiObjectResult = GenerateObjectResult<unknown>;
type AiSdkZodSchema = ZodTypeAny;
type AiZodSchemaAdapter = (schema: AiSdkZodSchema) => Schema<unknown>;
type AiUiMessage = Omit<UIMessage<Record<string, unknown>>, 'id'>;
type AiUiMessagePart = TextUIPart | FileUIPart;

// Isolate the AI SDK helper's recursive type so declaration builds do not exceed TypeScript's instantiation depth.
const zodSchemaValue: unknown = zodSchema;
const toAiSdkSchema = zodSchemaValue as AiZodSchemaAdapter;

export type AiProviderRegistryPort = Pick<
  AiProviderRegistryService,
  'listModels' | 'resolveLanguageModel'
>;
export type AiObjectSchemaRegistryPort = Pick<AiObjectSchemaRegistry, 'get'>;

/** Orchestrates AI SDK calls with configured models, tools, and object schemas. */
@Injectable()
export class AiService {
  /**
   * Create the AI orchestration service.
   *
   * @param providers - Registry that resolves model aliases to provider models.
   * @param schemas - Registry of schemas available for object generation.
   * @param tools - Registry of executable tool definitions.
   * @param endpoints - Endpoint limits used by provider calls.
   */
  constructor(
    @Inject(AiProviderRegistryService) private readonly providers: AiProviderRegistryPort,
    @Inject(AiObjectSchemaRegistry) private readonly schemas: AiObjectSchemaRegistryPort,
    private readonly tools: AiToolRegistry,
    @Inject(AI_ENDPOINT_OPTIONS) private readonly endpoints: Pick<NormalizedAiEndpointOptions, 'limits'>,
  ) {}

  /** List model aliases available to client endpoints. */
  listModels() {
    return this.providers.listModels();
  }

  /** List client-safe AI tool descriptors. */
  listTools() {
    return this.tools.listDescriptors();
  }

  /** Start a streamed chat response from UI messages. */
  async streamChat(request: AiChatRequest): Promise<AiTextStreamResult> {
    const tools = this.createTools();
    const stopWhen = this.createToolStopCondition(tools);

    return streamText({
      model: this.providers.resolveLanguageModel(request.model ?? 'chat'),
      system: request.system,
      messages: await convertToModelMessages(this.toUiMessages(request.messages), {
        ...(tools ? { tools } : {}),
        ignoreIncompleteToolCalls: true,
      }),
      ...(tools ? { tools } : {}),
      ...(stopWhen ? { stopWhen } : {}),
      temperature: request.temperature,
      maxOutputTokens: request.maxOutputTokens,
    });
  }

  /** Start a streamed text completion response. */
  streamCompletion(request: AiCompletionRequest): AiTextStreamResult {
    const tools = this.createTools();
    const stopWhen = this.createToolStopCondition(tools);

    return streamText({
      model: this.providers.resolveLanguageModel(request.model ?? 'fast'),
      system: request.system,
      prompt: request.prompt,
      ...(tools ? { tools } : {}),
      ...(stopWhen ? { stopWhen } : {}),
      temperature: request.temperature,
      maxOutputTokens: request.maxOutputTokens,
    });
  }

  /** Generate a non-streaming text completion. */
  async complete(request: AiCompletionRequest): Promise<AiTextResult> {
    const tools = this.createTools();
    const stopWhen = this.createToolStopCondition(tools);

    return generateText({
      model: this.providers.resolveLanguageModel(request.model ?? 'fast'),
      system: request.system,
      prompt: request.prompt,
      ...(tools ? { tools } : {}),
      ...(stopWhen ? { stopWhen } : {}),
      temperature: request.temperature,
      maxOutputTokens: request.maxOutputTokens,
    });
  }

  /** Generate a structured object using a registered Zod schema. */
  async generateObject(schemaKey: string, request: AiObjectRequest): Promise<AiObjectResult> {
    const schema = this.toAiSchema(this.schemas.get(schemaKey));

    return generateObject<Schema<unknown>, 'object', unknown>({
      model: this.providers.resolveLanguageModel(request.model ?? 'structured'),
      schema,
      output: 'object',
      system: request.system,
      prompt: request.input ? `${request.prompt}\n\nInput JSON:\n${JSON.stringify(request.input)}` : request.prompt,
      temperature: request.temperature,
      maxOutputTokens: request.maxOutputTokens,
    });
  }

  private createTools(): ToolSet | undefined {
    const definitions = this.tools.listDefinitions();
    if (definitions.length === 0) return undefined;

    const tools: ToolSet = {};

    for (const definition of definitions) {
      tools[definition.name] = tool<unknown, unknown>({
        description: definition.description,
        inputSchema: this.toAiSchema(definition.inputSchema),
        needsApproval: definition.requiresApproval ?? false,
        execute: definition.execute,
      });
    }

    return tools;
  }

  private createToolStopCondition(tools: ToolSet | undefined): StopCondition<ToolSet> | undefined {
    return tools ? stepCountIs(this.endpoints.limits.maxToolSteps) : undefined;
  }

  private toAiSchema(schema: AiSdkZodSchema): Schema<unknown> {
    return toAiSdkSchema(schema);
  }

  private toUiMessages(messages: AiChatRequest['messages']): AiUiMessage[] {
    return messages.map((message) => ({
      role: message.role === 'tool' ? 'assistant' : message.role,
      ...(message.metadata ? { metadata: message.metadata } : {}),
      parts: this.toUiMessageParts(message.parts, message.content),
    }));
  }

  private toUiMessageParts(parts: AiMessagePart[] | undefined, content: string | undefined): AiUiMessagePart[] {
    const uiParts: AiUiMessagePart[] = [];

    for (const part of parts ?? []) {
      const textPart = this.toTextPart(part);
      if (textPart) {
        uiParts.push(textPart);
        continue;
      }

      const filePart = this.toFilePart(part);
      if (filePart) uiParts.push(filePart);
    }

    return uiParts.length > 0 ? uiParts : [{ type: 'text', text: content ?? '' }];
  }

  private toTextPart(part: AiMessagePart): TextUIPart | undefined {
    const text = part['text'];
    if (part.type !== 'text' || typeof text !== 'string') return undefined;

    return { type: 'text', text };
  }

  private toFilePart(part: AiMessagePart): FileUIPart | undefined {
    const mediaType = part['mediaType'];
    const url = part['url'];
    if (part.type !== 'file' || typeof mediaType !== 'string' || typeof url !== 'string') return undefined;

    const filename = part['filename'];
    return {
      type: 'file',
      mediaType,
      url,
      ...(typeof filename === 'string' ? { filename } : {}),
    };
  }
}
