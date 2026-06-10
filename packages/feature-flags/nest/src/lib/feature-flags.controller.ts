import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import type { FeatureFlagDto as SharedFeatureFlagDto, FeatureScope } from '@otwld/ts-feature-flags';
import { FeatureFlagsService } from './feature-flags.service';
import {
  FeatureFlagAppContextDto,
  FeatureFlagConditionMetaMapDto,
  FeatureFlagDto as FeatureFlagDtoResponse,
  FeatureFlagEvaluationResultDto,
  FeatureFlagToggleDto,
  FeatureFlagUpsertDto,
  FeatureFlagUserContextDto,
} from './feature-flags.dtos';
import {
  filterFeatureFlagsByScope,
  withRequestHeaders,
} from './feature-flags.transport';

/**
 * REST API for managing and evaluating feature flags.
 * Consumers should apply their own authentication/authorization guards.
 */
@ApiTags('feature-flags')
@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly service: FeatureFlagsService) {}

  /**
   * Lists all feature flags, optionally filtered by scope.
   */
  @ApiOperation({ summary: 'List feature flags' })
  @ApiQuery({ name: 'scope', required: false, enum: ['user', 'app'] })
  @ApiOkResponse({ description: 'Array of feature documents', type: [FeatureFlagDtoResponse] })
  @Get()
  async list(@Query('scope') scope?: FeatureScope): Promise<SharedFeatureFlagDto[]> {
    return filterFeatureFlagsByScope(await this.service.listAll(), scope);
  }

  /**
   * Evaluates app-scoped flags for a given app context.
   */
  @ApiOperation({ summary: 'List enabled flags for an app context' })
  @ApiBody({ type: FeatureFlagAppContextDto })
  @ApiOkResponse({ description: 'Array of enabled feature evaluations', type: [FeatureFlagEvaluationResultDto] })
  @Post('list-enabled/app')
  async listEnabledForApp(
    @Body() context: FeatureFlagAppContextDto,
    @Req() request: Request,
  ): Promise<FeatureFlagEvaluationResultDto[]> {
    return this.service.listEnabledForContextApp(withRequestHeaders(context, request));
  }

  /**
   * Evaluates user-scoped flags for a given user context.
   */
  @ApiOperation({ summary: 'List enabled flags for a user context' })
  @ApiBody({ type: FeatureFlagUserContextDto })
  @ApiOkResponse({ description: 'Array of enabled feature evaluations', type: [FeatureFlagEvaluationResultDto] })
  @Post('list-enabled/user')
  async listEnabledForUser(
    @Body() context: FeatureFlagUserContextDto,
    @Req() request: Request,
  ): Promise<FeatureFlagEvaluationResultDto[]> {
    return this.service.listEnabledForContextUser(withRequestHeaders(context, request));
  }

  /**
   * Upserts a feature flag.
   */
  @ApiOperation({ summary: 'Create or update a feature flag' })
  @ApiBody({ type: FeatureFlagUpsertDto })
  @ApiOkResponse({ description: 'Upserted feature document', type: FeatureFlagDtoResponse })
  @Post()
  async upsert(@Body() dto: FeatureFlagUpsertDto): Promise<SharedFeatureFlagDto> {
    return this.service.upsert(dto);
  }

  /**
   * Toggles a feature flag on/off without changing other fields.
   */
  @ApiOperation({ summary: 'Toggle feature on/off' })
  @ApiBody({ type: FeatureFlagToggleDto })
  @ApiOkResponse({ description: 'Updated feature document', type: FeatureFlagDtoResponse })
  @Patch(':name/toggle')
  async toggle(@Param('name') name: string, @Body() dto: FeatureFlagToggleDto): Promise<SharedFeatureFlagDto> {
    return this.service.toggle(name, dto.enabled);
  }

  /**
   * Deletes a feature flag permanently.
   */
  @ApiOperation({ summary: 'Delete feature' })
  @ApiOkResponse({ schema: { properties: { ok: { type: 'boolean' } } } })
  @Delete(':name')
  async remove(@Param('name') name: string): Promise<{ ok: boolean }> {
    await this.service.remove(name);
    return { ok: true };
  }

  /**
   * Returns condition metadata for the requested scope.
   */
  @ApiOperation({ summary: 'Get condition metadata for building admin UI' })
  @ApiOkResponse({ type: FeatureFlagConditionMetaMapDto })
  @ApiQuery({ name: 'scope', type: String, required: true })
  @Get('conditions-meta')
  async getConditionsMeta(@Query('scope') scope: FeatureScope): Promise<FeatureFlagConditionMetaMapDto> {
    const map = await this.service.getConditionMetaForScope(scope);
    return { map };
  }
}
