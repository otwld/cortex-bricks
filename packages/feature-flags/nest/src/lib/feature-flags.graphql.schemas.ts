import { Field, ID, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';

import type {
  ConditionMeta,
  ConditionMetaOperator,
  FeatureCondition,
  FeatureEvaluationResultDto,
  FeatureFlagDto,
  FeatureFlagVariant,
  FeatureScope,
  PrimitiveTag,
  ResolvedSubjectMeta,
} from '@otwld/ts-feature-flags';
import { FeatureFlagsJson } from './feature-flags.graphql.scalar';
import type { FeatureFlagConditionMetaEntry } from './feature-flags.transport';

export enum FeatureFlagScopeModel {
  App = 'app',
  User = 'user',
}

export enum FeatureFlagPrimitiveTagModel {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
}

registerEnumType(FeatureFlagScopeModel, {
  name: 'FeatureFlagScope',
});

registerEnumType(FeatureFlagPrimitiveTagModel, {
  name: 'FeatureFlagPrimitiveTag',
});

@ObjectType()
@InputType('FeatureFlagConditionOperatorInput')
export class FeatureFlagConditionOperatorModel implements ConditionMetaOperator {
  @Field()
  name!: string;

  @Field({ nullable: true })
  field?: 'value' | 'values' | 'range';
}

@ObjectType()
@InputType('FeatureFlagConditionInput')
export class FeatureFlagConditionModel implements FeatureCondition {
  @Field()
  subject!: string;

  @Field()
  key!: string;

  @Field(() => FeatureFlagPrimitiveTagModel)
  valueType!: PrimitiveTag;

  @Field(() => FeatureFlagConditionOperatorModel)
  operator!: FeatureFlagConditionOperatorModel;

  @Field(() => FeatureFlagsJson, { nullable: true })
  value?: string | number | boolean;

  @Field(() => FeatureFlagsJson, { nullable: true })
  values?: Array<string | number | boolean>;

  @Field(() => FeatureFlagsJson, { nullable: true })
  range?: [number, number];

  @Field(() => FeatureFlagsJson, { nullable: true })
  extra?: unknown;
}

@ObjectType()
@InputType('FeatureFlagVariantInput')
export class FeatureFlagVariantModel implements FeatureFlagVariant {
  @Field()
  name!: string;

  @Field(() => FeatureFlagsJson, { nullable: true })
  payload?: Record<string, unknown>;

  @Field(() => [FeatureFlagConditionModel])
  conditions!: FeatureFlagConditionModel[];
}

@ObjectType()
export class FeatureFlagModel implements FeatureFlagDto {
  @Field(() => ID)
  _id!: string;

  @Field()
  name!: string;

  @Field()
  slug!: string;

  @Field(() => FeatureFlagScopeModel)
  scope!: FeatureScope;

  @Field()
  enabled!: boolean;

  @Field(() => FeatureFlagsJson, { nullable: true })
  payload?: Record<string, unknown>;

  @Field(() => [FeatureFlagVariantModel], { nullable: 'itemsAndList' })
  variants?: FeatureFlagVariantModel[];

  @Field(() => [FeatureFlagConditionModel])
  conditions!: FeatureFlagConditionModel[];

  @Field(() => [String])
  allowUserIds!: string[];

  @Field(() => [String])
  denyUserIds!: string[];

  @Field({ nullable: true })
  startsAt?: string;

  @Field({ nullable: true })
  endsAt?: string;

  @Field({ nullable: true })
  createdBy?: string;

  @Field({ nullable: true })
  updatedBy?: string;

  @Field()
  createdAt!: string;

  @Field()
  updatedAt!: string;
}

@ObjectType()
export class FeatureFlagEvaluationResultModel implements FeatureEvaluationResultDto {
  @Field()
  enabled!: boolean;

  @Field()
  name!: string;

  @Field()
  slug!: string;

  @Field(() => FeatureFlagsJson, { nullable: true })
  payload?: unknown;

  @Field({ nullable: true })
  variant?: string;
}

@ObjectType()
export class FeatureFlagConditionMetaOperatorModel {
  @Field()
  name!: string;

  @Field({ nullable: true })
  field?: 'value' | 'values' | 'range';
}

@ObjectType()
export class FeatureFlagConditionMetaModel implements ConditionMeta {
  @Field()
  name!: string;

  @Field(() => FeatureFlagPrimitiveTagModel)
  type!: PrimitiveTag;

  @Field(() => [FeatureFlagConditionMetaOperatorModel])
  operators!: readonly FeatureFlagConditionMetaOperatorModel[];

  @Field(() => [String])
  payloadFields!: readonly string[];

  @Field(() => [String], { nullable: 'itemsAndList' })
  options?: string[];
}

@ObjectType()
export class FeatureFlagSubjectMetaModel implements ResolvedSubjectMeta {
  @Field(() => FeatureFlagScopeModel)
  scope!: FeatureScope;

  @Field(() => [FeatureFlagConditionMetaModel])
  conditions!: FeatureFlagConditionMetaModel[];
}

@ObjectType()
export class FeatureFlagConditionMetaEntryModel implements FeatureFlagConditionMetaEntry {
  @Field()
  subject!: string;

  @Field(() => FeatureFlagSubjectMetaModel)
  meta!: FeatureFlagSubjectMetaModel;
}
