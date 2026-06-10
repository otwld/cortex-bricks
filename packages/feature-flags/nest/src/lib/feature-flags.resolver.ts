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

  /**
   * Lists all feature flags, optionally constrained to one evaluation scope.
   */
  @Query(() => [FeatureFlagModel], { name: 'featureFlags' })
  async list(
    @Args('scope', { type: () => FeatureFlagScopeModel, nullable: true }) scope?: FeatureScope,
  ): Promise<FeatureFlagDto[]> {
    return filterFeatureFlagsByScope(await this.service.listAll(), scope);
  }

  /**
   * Evaluates enabled app-scoped feature flags for the supplied context and request headers.
   */
  @Query(() => [FeatureFlagEvaluationResultModel], { name: 'enabledFeatureFlagsForApp' })
  async listEnabledForApp(
    @Args('input') input: FeatureFlagAppContextInput,
    @Context('req') request?: Request,
  ): Promise<FeatureEvaluationResultDto[]> {
    return this.service.listEnabledForContextApp(withRequestHeaders(input, request));
  }

  /**
   * Evaluates enabled user-scoped feature flags for the supplied context and request headers.
   */
  @Query(() => [FeatureFlagEvaluationResultModel], { name: 'enabledFeatureFlagsForUser' })
  async listEnabledForUser(
    @Args('input') input: FeatureFlagUserContextInput,
    @Context('req') request?: Request,
  ): Promise<FeatureEvaluationResultDto[]> {
    return this.service.listEnabledForContextUser(withRequestHeaders(input, request));
  }

  /**
   * Creates or replaces a feature flag and returns the stored admin representation.
   */
  @Mutation(() => FeatureFlagModel, { name: 'upsertFeatureFlag' })
  async upsert(@Args('input') input: FeatureFlagUpsertInput): Promise<FeatureFlagDto> {
    return this.service.upsert(input);
  }

  /**
   * Updates a feature flag's global enabled state without changing targeting rules.
   */
  @Mutation(() => FeatureFlagModel, { name: 'toggleFeatureFlag' })
  async toggle(@Args('input') input: FeatureFlagToggleInput): Promise<FeatureFlagDto> {
    return this.service.toggle(input.name, input.enabled);
  }

  /**
   * Removes a feature flag by name or slug and returns true when deletion completes.
   */
  @Mutation(() => Boolean, { name: 'removeFeatureFlag' })
  async remove(@Args('name') name: string): Promise<boolean> {
    await this.service.remove(name);
    return true;
  }

  /**
   * Returns scope-specific condition metadata as GraphQL-friendly map entries.
   */
  @Query(() => [FeatureFlagConditionMetaEntryModel], { name: 'featureFlagConditionMeta' })
  async getConditionsMeta(
    @Args('scope', { type: () => FeatureFlagScopeModel }) scope: FeatureScope,
  ): Promise<FeatureFlagConditionMetaEntry[]> {
    return toConditionMetaEntries(await this.service.getConditionMetaForScope(scope));
  }
}
