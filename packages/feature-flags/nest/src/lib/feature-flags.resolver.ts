import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { Request } from 'express';

import type { FeatureEvaluationResultDto, FeatureFlagDto, FeatureScope } from '@otwld/ts-feature-flags';
import {
  FeatureFlagAppContextInput,
  FeatureFlagToggleInput,
  FeatureFlagUpsertInput,
  FeatureFlagUserContextInput,
} from './feature-flags.graphql.inputs';
import {
  FeatureFlagConditionMetaEntryModel,
  FeatureFlagEvaluationResultModel,
  FeatureFlagModel,
  FeatureFlagScopeModel,
} from './feature-flags.graphql.schemas';
import {
  filterFeatureFlagsByScope,
  toConditionMetaEntries,
  type FeatureFlagConditionMetaEntry,
  withRequestHeaders,
} from './feature-flags.transport';
import { FeatureFlagsService } from './feature-flags.service';

/**
 * GraphQL API for managing and evaluating feature flags.
 */
@Resolver(() => FeatureFlagModel)
export class FeatureFlagsResolver {
  constructor(private readonly service: FeatureFlagsService) {}

  @Query(() => [FeatureFlagModel], { name: 'featureFlags' })
  async list(
    @Args('scope', { type: () => FeatureFlagScopeModel, nullable: true }) scope?: FeatureScope,
  ): Promise<FeatureFlagDto[]> {
    return filterFeatureFlagsByScope(await this.service.listAll(), scope);
  }

  @Query(() => [FeatureFlagEvaluationResultModel], { name: 'enabledFeatureFlagsForApp' })
  async listEnabledForApp(
    @Args('input') input: FeatureFlagAppContextInput,
    @Context('req') request?: Request,
  ): Promise<FeatureEvaluationResultDto[]> {
    return this.service.listEnabledForContextApp(withRequestHeaders(input, request));
  }

  @Query(() => [FeatureFlagEvaluationResultModel], { name: 'enabledFeatureFlagsForUser' })
  async listEnabledForUser(
    @Args('input') input: FeatureFlagUserContextInput,
    @Context('req') request?: Request,
  ): Promise<FeatureEvaluationResultDto[]> {
    return this.service.listEnabledForContextUser(withRequestHeaders(input, request));
  }

  @Mutation(() => FeatureFlagModel, { name: 'upsertFeatureFlag' })
  async upsert(@Args('input') input: FeatureFlagUpsertInput): Promise<FeatureFlagDto> {
    return this.service.upsert(input);
  }

  @Mutation(() => FeatureFlagModel, { name: 'toggleFeatureFlag' })
  async toggle(@Args('input') input: FeatureFlagToggleInput): Promise<FeatureFlagDto> {
    return this.service.toggle(input.name, input.enabled);
  }

  @Mutation(() => Boolean, { name: 'removeFeatureFlag' })
  async remove(@Args('name') name: string): Promise<boolean> {
    await this.service.remove(name);
    return true;
  }

  @Query(() => [FeatureFlagConditionMetaEntryModel], { name: 'featureFlagConditionMeta' })
  async getConditionsMeta(
    @Args('scope', { type: () => FeatureFlagScopeModel }) scope: FeatureScope,
  ): Promise<FeatureFlagConditionMetaEntry[]> {
    return toConditionMetaEntries(await this.service.getConditionMetaForScope(scope));
  }
}
