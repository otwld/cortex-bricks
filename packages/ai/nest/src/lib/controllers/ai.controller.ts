import { Body, Controller, Get, Inject, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
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

/**
 * Provides ai controller behavior.
 */
@Controller()
@UseGuards(AiEndpointGuard)
export class AiController {
  private readonly requestSchemas: ReturnType<typeof createAiRequestSchemas>;

  /**
   * Creates a ai controller instance.
   *
   * @param ai - ai value.
   *
   * @param quota - quota value.
   *
   * @param endpoints - endpoints value.
   */
  constructor(
    private readonly ai: AiService,
    private readonly quota: AiQuotaService,
    @Inject(AI_ENDPOINT_OPTIONS) endpoints: Pick<NormalizedAiEndpointOptions, 'limits'>,
  ) {
    this.requestSchemas = createAiRequestSchemas(endpoints.limits);
  }

  /**
   * Runs models.
   *
   * @returns The ai controller models result.
   */
  @Get('models')
  models() {
    return this.ai.listModels();
  }

  /**
   * Runs tools.
   *
   * @returns The ai controller tools result.
   */
  @Get('tools')
  tools() {
    return this.ai.listTools();
  }

  /**
   * Runs usage.
   *
   * @param request - request value.
   *
   * @returns The ai controller usage result.
   */
  @Get('usage')
  usage(@Req() request: Request) {
    return this.quota.snapshotForRequest(request);
  }

  /**
   * Runs chat.
   *
   * @param body - body value.
   *
   * @param req - req value.
   *
   * @param response - response value.
   *
   * @returns The ai controller chat result.
   */
  /**
   * Runs chat.
   *
   * @param body - body value.
   *
   * @param req - req value.
   *
   * @param response - response value.
   *
   * @returns The ai controller chat result.
   *
   * @throws When the operation cannot be completed.
   */
  @Post('chat')
  async chat(@Body() body: AiChatRequest, @Req() req: Request, @Res() response: ServerResponse<IncomingMessage>) {
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

  /**
   * Runs completion.
   *
   * @param body - body value.
   *
   * @param req - req value.
   *
   * @param response - response value.
   *
   * @returns The ai controller completion result.
   */
  /**
   * Runs completion.
   *
   * @param body - body value.
   *
   * @param req - req value.
   *
   * @param response - response value.
   *
   * @returns The ai controller completion result.
   *
   * @throws When the operation cannot be completed.
   */
  @Post('completion')
  async completion(@Body() body: AiCompletionRequest, @Req() req: Request, @Res() response: ServerResponse<IncomingMessage>) {
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

  /**
   * Runs object.
   *
   * @param schemaKey - schema key value.
   *
   * @param body - body value.
   *
   * @param req - req value.
   *
   * @returns The ai controller object result.
   */
  /**
   * Runs object.
   *
   * @param schemaKey - schema key value.
   *
   * @param body - body value.
   *
   * @param req - req value.
   *
   * @returns The ai controller object result.
   *
   * @throws When the operation cannot be completed.
   */
  @Post('object/:schemaKey')
  async object(@Param('schemaKey') schemaKey: string, @Body() body: AiObjectRequest, @Req() req: Request) {
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
