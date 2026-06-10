import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import type {
  ConditionMetaOperator,
  FeatureCondition,
  FeatureScope,
  PrimitiveTag,
} from '@otwld/ts-feature-flags';
import { PRIMITIVE_TAGS } from '@otwld/ts-feature-flags';

/**
 * Subdocument describing the operator semantics.
 */
@Schema({ _id: false })
export class FeatureFlagOperator {
  /**
   * Operator identifier interpreted by the feature-flag evaluation engine.
   */
  @Prop({ type: String, required: true })
  name!: string;

  /**
   * Condition value slot this operator reads when evaluating a rule.
   */
  @Prop({ type: String, enum: ['value', 'values', 'range'], required: false })
  field?: ConditionMetaOperator['field'];
}

/**
 * Embedded schema for condition operator metadata.
 */
export const FeatureFlagOperatorSchema = SchemaFactory.createForClass(FeatureFlagOperator);

/**
 * A single, generic condition used by the feature targeting engine.
 */
@Schema({ _id: false, minimize: false })
export class FeatureFlagCondition implements FeatureCondition {
  /**
   * Targeting subject namespace, such as app or user, that owns the condition key.
   */
  @Prop({ type: String, required: true })
  subject!: string;

  /**
   * Subject-specific attribute key that is compared against the evaluation context.
   */
  @Prop({ type: String, required: true })
  key!: string;

  /**
   * Primitive type expected for the compared condition value.
   */
  @Prop({ type: String, enum: PRIMITIVE_TAGS, required: true })
  valueType!: PrimitiveTag;

  /**
   * Operator metadata used to select the comparison behavior and input slot.
   */
  @Prop({ type: FeatureFlagOperatorSchema, required: true })
  operator!: FeatureFlagOperator;

  /**
   * Single comparison value used by operators that target the `value` slot.
   */
  @Prop({ type: SchemaTypes.Mixed })
  value?: string | number | boolean;

  /**
   * Collection of comparison values used by membership-style operators.
   */
  @Prop({ type: [SchemaTypes.Mixed] })
  values?: Array<string | number | boolean>;

  /**
   * Inclusive numeric range tuple validated as `[min, max]` when present.
   */
  @Prop({
    type: [Number],
    validate: {
      validator: (v: unknown) =>
        Array.isArray(v) ? v.length === 2 && v.every((n) => typeof n === 'number' && Number.isFinite(n)) : true,
      message: 'range must be a 2-number tuple: [min, max]',
    },
  })
  range?: [number, number];

  /**
   * Operator-specific payload reserved for condition types that need extra data.
   */
  @Prop({ type: SchemaTypes.Mixed })
  extra?: unknown;
}

/**
 * Embedded schema for feature-flag targeting conditions.
 */
export const FeatureFlagConditionSchema = SchemaFactory.createForClass(FeatureFlagCondition);

/**
 * Embedded variant document with its own targeting conditions and payload.
 */
@Schema({ _id: false, minimize: false })
export class FeatureFlagVariant {
  /**
   * Variant-level conditions that must pass before this variant payload is selected.
   */
  @Prop({ type: [FeatureFlagConditionSchema], default: [] })
  conditions!: FeatureCondition[];

  /**
   * Stable variant name returned in evaluation results when this variant matches.
   */
  @Prop({ type: String, required: true })
  name!: string;

  /**
   * Variant payload merged over the base feature payload for matching contexts.
   */
  @Prop({ type: SchemaTypes.Mixed })
  payload?: Record<string, unknown>;
}

/**
 * Embedded schema for ordered feature-flag variants.
 */
export const FeatureFlagVariantSchema = SchemaFactory.createForClass(FeatureFlagVariant);

/**
 * Hydrated Mongoose document for a feature-flag record.
 */
export type FeatureFlagDocument = HydratedDocument<FeatureFlag>;

/**
 * Mongoose entity for feature flags.
 */
@Schema({ timestamps: true, minimize: false })
export class FeatureFlag {
  /**
   * MongoDB document id exposed as a string in transport DTOs.
   */
  _id!: string;

  /**
   * Timestamp created by Mongoose when the flag document is first persisted.
   */
  createdAt!: Date;

  /**
   * Timestamp updated by Mongoose whenever the flag document changes.
   */
  updatedAt!: Date;

  /**
   * Human-readable admin label for the feature flag.
   */
  @Prop({ type: String, required: true, index: true })
  name!: string;

  /**
   * Stable slug used as the lookup key for evaluation and toggling.
   */
  @Prop({ type: String, required: true, index: true })
  slug!: string;

  /**
   * Evaluation scope that determines whether app or user context is required.
   */
  @Prop({ type: String, enum: ['app', 'user'], required: true, index: true })
  scope!: FeatureScope;

  /**
   * Global gate that must be true before conditions or variants can enable the flag.
   */
  @Prop({ type: Boolean, default: false, index: true })
  enabled!: boolean;

  /**
   * Base JSON payload returned to clients when the flag evaluates as enabled.
   */
  @Prop({ type: SchemaTypes.Mixed })
  payload?: Record<string, unknown>;

  /**
   * Ordered variant definitions evaluated after base flag gates pass.
   */
  @Prop({ type: [FeatureFlagVariantSchema], default: [] })
  variants!: FeatureFlagVariant[];

  /**
   * Base targeting rules that must pass before variants or allow lists are applied.
   */
  @Prop({ type: [FeatureFlagConditionSchema], default: [] })
  conditions!: FeatureCondition[];

  /**
   * User identifiers explicitly allowed after the base targeting rules pass.
   */
  @Prop({ type: [String], default: [] })
  allowUserIds!: string[];

  /**
   * User identifiers explicitly denied last, overriding allow-list matches.
   */
  @Prop({ type: [String], default: [] })
  denyUserIds!: string[];

  /**
   * Optional UTC activation time before which the flag should not evaluate as enabled.
   */
  @Prop({ type: Date, index: true })
  startsAt?: Date;

  /**
   * Optional UTC expiration time after which the flag should not evaluate as enabled.
   */
  @Prop({ type: Date, index: true })
  endsAt?: Date;

  /**
   * MongoDB ObjectId string for the actor that created the flag, when tracked.
   */
  @Prop({ type: String, validate: (v: string) => !v || Types.ObjectId.isValid(v) })
  createdBy?: string;

  /**
   * MongoDB ObjectId string for the actor that last changed the flag, when tracked.
   */
  @Prop({ type: String, validate: (v: string) => !v || Types.ObjectId.isValid(v) })
  updatedBy?: string;
}

/**
 * Mongoose schema for feature flag records.
 */
export const FeatureFlagSchema = SchemaFactory.createForClass(FeatureFlag);
