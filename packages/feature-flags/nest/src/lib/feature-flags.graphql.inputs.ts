import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import type {
  FeatureFlagAppContext,
  FeatureFlagUpsertDto,
  FeatureFlagUserContext,
  FeatureScope,
} from '@otwld/ts-feature-flags';
import {
  FeatureFlagConditionModel,
  FeatureFlagScopeModel,
  FeatureFlagVariantModel,
} from './feature-flags.graphql.schemas';
import { FeatureFlagsJson } from './feature-flags.graphql.scalar';

type FeatureFlagToggleContract = Pick<FeatureFlagUpsertDto, 'name' | 'enabled'>;

/**
 * Shared GraphQL input fields for feature-flag evaluation contexts.
 */
@InputType()
export class FeatureFlagContextBaseInput implements Pick<FeatureFlagAppContext, 'extra'> {
  /**
   * Additional context attributes passed through to condition resolvers.
   */
  @Field(() => FeatureFlagsJson, { nullable: true })
  @IsOptional()
  @IsObject()
  extra?: Record<string, unknown>;
}

/**
 * GraphQL input for app-scoped feature-flag evaluation.
 */
@InputType()
export class FeatureFlagAppContextInput extends FeatureFlagContextBaseInput implements FeatureFlagAppContext {
  /**
   * Application version used by app-scoped conditions such as version gates.
   */
  @Field()
  @IsString()
  @IsNotEmpty()
  version!: string;
}

/**
 * GraphQL input for user-scoped feature-flag evaluation.
 */
@InputType()
export class FeatureFlagUserContextInput extends FeatureFlagContextBaseInput implements FeatureFlagUserContext {
  /**
   * User identifier from the consuming product's identity system.
   */
  @Field()
  @IsString()
  @IsNotEmpty()
  userId!: string;
}

/**
 * GraphQL input accepted when creating or replacing a feature flag.
 */
@InputType()
export class FeatureFlagUpsertInput implements FeatureFlagUpsertDto {
  /**
   * Human-readable name used to derive the stable slug for new flags.
   */
  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  /**
   * Context scope that determines whether app or user evaluation inputs apply.
   */
  @Field(() => FeatureFlagScopeModel)
  scope!: FeatureScope;

  /**
   * Global feature gate that must be enabled before targeting can pass.
   */
  @Field()
  @IsBoolean()
  enabled!: boolean;

  /**
   * Base JSON payload returned when the flag evaluates as enabled.
   */
  @Field(() => FeatureFlagsJson, { nullable: true })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  /**
   * Ordered variant definitions evaluated after base flag conditions pass.
   */
  @Field(() => [FeatureFlagVariantModel], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureFlagVariantModel)
  variants?: FeatureFlagVariantModel[];

  /**
   * Base targeting rules evaluated before allow lists and variant selection.
   */
  @Field(() => [FeatureFlagConditionModel])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureFlagConditionModel)
  conditions!: FeatureFlagConditionModel[];

  /**
   * User identifiers explicitly allowed after condition checks pass.
   */
  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  allowUserIds?: string[];

  /**
   * User identifiers explicitly denied last, overriding allow-list matches.
   */
  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  denyUserIds?: string[];

  /**
   * UTC datetime before which the flag should evaluate as disabled.
   */
  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  /**
   * UTC datetime after which the flag should evaluate as disabled.
   */
  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  endsAt?: string;
}

/**
 * GraphQL input accepted when toggling a feature flag.
 */
@InputType()
export class FeatureFlagToggleInput implements FeatureFlagToggleContract {
  /**
   * Feature flag name or slug to toggle.
   */
  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  /**
   * New global enabled state for the feature flag.
   */
  @Field()
  @IsBoolean()
  enabled!: boolean;
}
