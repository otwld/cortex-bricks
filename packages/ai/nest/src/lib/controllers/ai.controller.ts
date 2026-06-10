import { Body, Controller, Get, Inject, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { z } from 'zod';
import {
  AiChatRequest,
  AiCompletionRequest,
  AiObjectRequest,
  createAiRequestSchemas,
} from '@otwld/ts-ai';
import { AI_ENDPOINT_OPTIONS, NormalizedAiEndpointOptions } from '../config/ai-module-options';
import { AiException } from '../exceptions/ai.exception';
import { AiEndpointGuard } from '../guards/ai-endpoint.guard';
import { AiQuotaService } from '../quota/ai-quota.service';
import { AiService } from '../services/ai.service';

/** HTTP controller exposing configured AI model, tool, quota, and generation endpoints. */
@Controller()
@UseGuards(AiEndpointGuard)
export class AiController {
  private readonly requestSchemas: ReturnType<typeof createAiRequestSchemas>;

  /**
   * Create the AI HTTP controller.
   *
   * @param ai - AI orchestration service.
   * @param quota - Quota service used to reserve and commit token usage.
   * @param endpoints - Endpoint limits used to build request validators.
   */
  constructor(
    private readonly ai: AiService,
    private readonly quota: AiQuotaService,
    @Inject(AI_ENDPOINT_OPTIONS) endpoints: Pick<NormalizedAiEndpointOptions, 'limits'>,
  ) {
    this.requestSchemas = createAiRequestSchemas(endpoints.limits);
  }

  /** Return model aliases visible to clients. */
  @Get('models')
  models() {
    return this.ai.listModels();
  }

  /** Return tool descriptors visible to clients. */
  @Get('tools')
  tools() {
    return this.ai.listTools();
  }

  /** Return quota usage for the authenticated request subject. */
  @Get('usage')
  usage(@Req() request: unknown) {
    return this.quota.snapshotForRequest(request);
  }

  /** Stream a chat response after request validation and quota reservation. */
  @Post('chat')
  async chat(@Body() body: AiChatRequest, @Req() req: unknown, @Res() response: ServerResponse<IncomingMessage>) {
    const request = this.parseRequest(this.requestSchemas.aiChatRequestSchema, body) as AiChatRequest;
    const reservation = await this.quota.reserveForRequest(req, 'chat', request);

    try {
      const result = await this.ai.streamChat(request);
      this.quota.commitWhenUsageSettles(reservation, result.usage);
      return result.pipeUIMessageStreamToResponse(response);
    } catch (error) {
      await this.quota.release(reservation);
      throw error;
    }
  }

  /** Stream a text completion after request validation and quota reservation. */
  @Post('completion')
  async completion(@Body() body: AiCompletionRequest, @Req() req: unknown, @Res() response: ServerResponse<IncomingMessage>) {
    const request = this.parseRequest(this.requestSchemas.aiCompletionRequestSchema, body) as AiCompletionRequest;
    const reservation = await this.quota.reserveForRequest(req, 'completion', request);

    try {
      const result = this.ai.streamCompletion(request);
      this.quota.commitWhenUsageSettles(reservation, result.usage);
      return result.pipeTextStreamToResponse(response);
    } catch (error) {
      await this.quota.release(reservation);
      throw error;
    }
  }

  /** Generate a structured object with a registered schema key. */
  @Post('object/:schemaKey')
  async object(@Param('schemaKey') schemaKey: string, @Body() body: AiObjectRequest, @Req() req: unknown) {
    const request = this.parseRequest(this.requestSchemas.aiObjectRequestSchema, body) as AiObjectRequest;
    const reservation = await this.quota.reserveForRequest(req, 'object', request);

    try {
      const result = await this.ai.generateObject(schemaKey, request);
      await this.quota.commit(reservation, result.usage);
      return { object: result.object, usage: result.usage };
    } catch (error) {
      await this.quota.release(reservation);
      throw error;
    }
  }

  private parseRequest<T>(schema: z.ZodType<T>, body: unknown): T {
    const result = schema.safeParse(body);
    if (result.success) return result.data;

    throw AiException.validationFailed(
      result.error.issues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        path: issue.path.join('.'),
      })),
    );
  }
}
