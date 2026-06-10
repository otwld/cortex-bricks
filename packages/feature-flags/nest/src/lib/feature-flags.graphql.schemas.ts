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

/**
 * GraphQL enum for supported feature-flag scopes.
 */
export enum FeatureFlagScopeModel {
  App = 'app',
  User = 'user',
}

/**
 * GraphQL enum for condition primitive value types.
 */
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

/**
 * GraphQL model and input for a condition operator.
 */
@ObjectType()
@InputType('FeatureFlagConditionOperatorInput')
export class FeatureFlagConditionOperatorModel implements ConditionMetaOperator {
  /**
   * Operator identifier interpreted by the feature-flag evaluation engine.
   */
  @Field()
  name!: string;

  /**
   * Condition payload slot supplied to this operator during evaluation.
   */
  @Field({ nullable: true })
  field?: 'value' | 'values' | 'range';
}

/**
 * GraphQL model and input for one feature-flag targeting condition.
 */
@ObjectType()
@InputType('FeatureFlagConditionInput')
export class FeatureFlagConditionModel implements FeatureCondition {
  /**
   * Subject namespace that selects the condition resolver.
   */
  @Field()
  subject!: string;

  /**
   * Attribute key compared against values from the resolved evaluation context.
   */
  @Field()
  key!: string;

  /**
   * Primitive type expected for `value`, `values`, or `range` comparisons.
   */
  @Field(() => FeatureFlagPrimitiveTagModel)
  valueType!: PrimitiveTag;

  /**
   * Operator metadata that determines how the condition payload is interpreted.
   */
  @Field(() => FeatureFlagConditionOperatorModel)
  operator!: FeatureFlagConditionOperatorModel;

  /**
   * Single comparison value used when the operator reads the `value` slot.
   */
  @Field(() => FeatureFlagsJson, { nullable: true })
  value?: string | number | boolean;

  /**
   * Multiple comparison values used when the operator reads the `values` slot.
   */
  @Field(() => FeatureFlagsJson, { nullable: true })
  values?: Array<string | number | boolean>;

  /**
   * Numeric range tuple supplied as `[min, max]` for range comparisons.
   */
  @Field(() => FeatureFlagsJson, { nullable: true })
  range?: [number, number];

  /**
   * Operator-specific extension payload for future condition metadata.
   */
  @Field(() => FeatureFlagsJson, { nullable: true })
  extra?: unknown;
}

/**
 * GraphQL model and input for one named feature-flag variant.
 */
@ObjectType()
@InputType('FeatureFlagVariantInput')
export class FeatureFlagVariantModel implements FeatureFlagVariant {
  /**
   * Stable label returned in evaluation results when this variant matches.
   */
  @Field()
  name!: string;

  /**
   * JSON payload returned for matching contexts, merged over the base payload.
   */
  @Field(() => FeatureFlagsJson, { nullable: true })
  payload?: Record<string, unknown>;

  /**
   * Conditions that all must pass before the variant can be selected.
   */
  @Field(() => [FeatureFlagConditionModel])
  conditions!: FeatureFlagConditionModel[];
}

/**
 * GraphQL model for a complete feature-flag record.
 */
@ObjectType()
export class FeatureFlagModel implements FeatureFlagDto {
  /**
   * MongoDB document id serialized for GraphQL clients.
   */
  @Field(() => ID)
  _id!: string;

  /**
   * Human-readable name displayed to administrators.
   */
  @Field()
  name!: string;

  /**
   * Stable lookup key used for evaluation and mutations.
   */
  @Field()
  slug!: string;

  /**
   * Context scope that determines whether app or user evaluation inputs apply.
   */
  @Field(() => FeatureFlagScopeModel)
  scope!: FeatureScope;

  /**
   * Global feature gate that must be true before targeting rules can enable it.
   */
  @Field()
  enabled!: boolean;

  /**
   * Base JSON payload returned when the flag evaluates as enabled.
   */
  @Field(() => FeatureFlagsJson, { nullable: true })
  payload?: Record<string, unknown>;

  /**
   * Ordered variant definitions evaluated after the base feature gates pass.
   */
  @Field(() => [FeatureFlagVariantModel], { nullable: 'itemsAndList' })
  variants?: FeatureFlagVariantModel[];

  /**
   * Base targeting rules evaluated before allow lists and variant selection.
   */
  @Field(() => [FeatureFlagConditionModel])
  conditions!: FeatureFlagConditionModel[];

  /**
   * User identifiers explicitly allowed after condition checks pass.
   */
  @Field(() => [String])
  allowUserIds!: string[];

  /**
   * User identifiers explicitly denied last, overriding allow-list matches.
   */
  @Field(() => [String])
  denyUserIds!: string[];

  /**
   * UTC datetime before which the flag should evaluate as disabled.
   */
  @Field({ nullable: true })
  startsAt?: string;

  /**
   * UTC datetime after which the flag should evaluate as disabled.
   */
  @Field({ nullable: true })
  endsAt?: string;

  /**
   * Identifier for the actor that created the flag, when tracked by the caller.
   */
  @Field({ nullable: true })
  createdBy?: string;

  /**
   * Identifier for the actor that most recently updated the flag.
   */
  @Field({ nullable: true })
  updatedBy?: string;

  /**
   * UTC timestamp when the flag record was created.
   */
  @Field()
  createdAt!: string;

  /**
   * UTC timestamp when the flag record last changed.
   */
  @Field()
  updatedAt!: string;
}

/**
 * GraphQL model returned after evaluating one feature flag.
 */
@ObjectType()
export class FeatureFlagEvaluationResultModel implements FeatureEvaluationResultDto {
  /**
   * Whether this flag is enabled for the supplied evaluation context.
   */
  @Field()
  enabled!: boolean;

  /**
   * Human-readable flag name associated with the evaluation result.
   */
  @Field()
  name!: string;

  /**
   * Stable flag slug used as the client lookup key.
   */
  @Field()
  slug!: string;

  /**
   * Resolved payload returned to the client after base and variant merging.
   */
  @Field(() => FeatureFlagsJson, { nullable: true })
  payload?: unknown;

  /**
   * Name of the matching variant, or undefined when only the base flag matched.
   */
  @Field({ nullable: true })
  variant?: string;
}

/**
 * GraphQL model for operator metadata in condition metadata responses.
 */
@ObjectType()
export class FeatureFlagConditionMetaOperatorModel {
  /**
   * Operator identifier displayed to admin clients and stored on conditions.
   */
  @Field()
  name!: string;

  /**
   * Condition payload slot supplied to this operator during evaluation.
   */
  @Field({ nullable: true })
  field?: 'value' | 'values' | 'range';
}

/**
 * GraphQL model for one resolved condition metadata entry.
 */
@ObjectType()
export class FeatureFlagConditionMetaModel implements ConditionMeta {
  /**
   * Admin-facing label for the condition attribute group.
   */
  @Field()
  name!: string;

  /**
   * Primitive value type expected by all operators in this metadata entry.
   */
  @Field(() => FeatureFlagPrimitiveTagModel)
  type!: PrimitiveTag;

  /**
   * Operators supported for the condition attribute.
   */
  @Field(() => [FeatureFlagConditionMetaOperatorModel])
  operators!: readonly FeatureFlagConditionMetaOperatorModel[];

  /**
   * Required payload fields a client must supply when creating this condition.
   */
  @Field(() => [String])
  payloadFields!: readonly string[];

  /**
   * Predefined selectable values for attributes with a constrained option set.
   */
  @Field(() => [String], { nullable: 'itemsAndList' })
  options?: string[];
}

/**
 * GraphQL model grouping resolved condition metadata under one scope.
 */
@ObjectType()
export class FeatureFlagSubjectMetaModel implements ResolvedSubjectMeta {
  /**
   * Feature-flag scope that owns the returned condition metadata.
   */
  @Field(() => FeatureFlagScopeModel)
  scope!: FeatureScope;

  /**
   * Condition definitions available for the scope.
   */
  @Field(() => [FeatureFlagConditionMetaModel])
  conditions!: FeatureFlagConditionMetaModel[];
}

/**
 * GraphQL model for a subject-keyed condition metadata map entry.
 */
@ObjectType()
export class FeatureFlagConditionMetaEntryModel implements FeatureFlagConditionMetaEntry {
  /**
   * Subject key for one entry in the condition metadata map.
   */
  @Field()
  subject!: string;

  /**
   * Resolved metadata for the subject key.
   */
  @Field(() => FeatureFlagSubjectMetaModel)
  meta!: FeatureFlagSubjectMetaModel;
}
