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

@InputType()
export class FeatureFlagContextBaseInput implements Pick<FeatureFlagAppContext, 'extra'> {
  @Field(() => FeatureFlagsJson, { nullable: true })
  @IsOptional()
  @IsObject()
  extra?: Record<string, unknown>;
}

@InputType()
export class FeatureFlagAppContextInput extends FeatureFlagContextBaseInput implements FeatureFlagAppContext {
  @Field()
  @IsString()
  @IsNotEmpty()
  version!: string;
}

@InputType()
export class FeatureFlagUserContextInput extends FeatureFlagContextBaseInput implements FeatureFlagUserContext {
  @Field()
  @IsString()
  @IsNotEmpty()
  userId!: string;
}

@InputType()
export class FeatureFlagUpsertInput implements FeatureFlagUpsertDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field(() => FeatureFlagScopeModel)
  scope!: FeatureScope;

  @Field()
  @IsBoolean()
  enabled!: boolean;

  @Field(() => FeatureFlagsJson, { nullable: true })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @Field(() => [FeatureFlagVariantModel], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureFlagVariantModel)
  variants?: FeatureFlagVariantModel[];

  @Field(() => [FeatureFlagConditionModel])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureFlagConditionModel)
  conditions!: FeatureFlagConditionModel[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  allowUserIds?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  denyUserIds?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  endsAt?: string;
}

@InputType()
export class FeatureFlagToggleInput implements FeatureFlagToggleContract {
  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field()
  @IsBoolean()
  enabled!: boolean;
}
