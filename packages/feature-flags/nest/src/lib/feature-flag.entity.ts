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
  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String, enum: ['value', 'values', 'range'], required: false })
  field?: ConditionMetaOperator['field'];
}

export const FeatureFlagOperatorSchema = SchemaFactory.createForClass(FeatureFlagOperator);

/**
 * A single, generic condition used by the feature targeting engine.
 */
@Schema({ _id: false, minimize: false })
export class FeatureFlagCondition implements FeatureCondition {
  @Prop({ type: String, required: true })
  subject!: string;

  @Prop({ type: String, required: true })
  key!: string;

  @Prop({ type: String, enum: PRIMITIVE_TAGS, required: true })
  valueType!: PrimitiveTag;

  @Prop({ type: FeatureFlagOperatorSchema, required: true })
  operator!: FeatureFlagOperator;

  @Prop({ type: SchemaTypes.Mixed })
  value?: string | number | boolean;

  @Prop({ type: [SchemaTypes.Mixed] })
  values?: Array<string | number | boolean>;

  @Prop({
    type: [Number],
    validate: {
      validator: (v: unknown) =>
        Array.isArray(v) ? v.length === 2 && v.every((n) => typeof n === 'number' && Number.isFinite(n)) : true,
      message: 'range must be a 2-number tuple: [min, max]',
    },
  })
  range?: [number, number];

  @Prop({ type: SchemaTypes.Mixed })
  extra?: unknown;
}

export const FeatureFlagConditionSchema = SchemaFactory.createForClass(FeatureFlagCondition);

@Schema({ _id: false, minimize: false })
export class FeatureFlagVariant {
  @Prop({ type: [FeatureFlagConditionSchema], default: [] })
  conditions!: FeatureCondition[];

  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: SchemaTypes.Mixed })
  payload?: Record<string, unknown>;
}

export const FeatureFlagVariantSchema = SchemaFactory.createForClass(FeatureFlagVariant);
/** FeatureFlagDocument. */


export type FeatureFlagDocument = HydratedDocument<FeatureFlag>;

/**
 * Mongoose entity for feature flags.
 */
@Schema({ timestamps: true, minimize: false })
export class FeatureFlag {
  _id!: string;

  createdAt!: Date;
  updatedAt!: Date;

  @Prop({ type: String, required: true, index: true })
  name!: string;

  @Prop({ type: String, required: true, index: true })
  slug!: string;

  @Prop({ type: String, enum: ['app', 'user'], required: true, index: true })
  scope!: FeatureScope;

  @Prop({ type: Boolean, default: false, index: true })
  enabled!: boolean;

  @Prop({ type: SchemaTypes.Mixed })
  payload?: Record<string, unknown>;

  @Prop({ type: [FeatureFlagVariantSchema], default: [] })
  variants!: FeatureFlagVariant[];

  @Prop({ type: [FeatureFlagConditionSchema], default: [] })
  conditions!: FeatureCondition[];

  @Prop({ type: [String], default: [] })
  allowUserIds!: string[];

  @Prop({ type: [String], default: [] })
  denyUserIds!: string[];

  @Prop({ type: Date, index: true })
  startsAt?: Date;

  @Prop({ type: Date, index: true })
  endsAt?: Date;

  @Prop({ type: String, validate: (v: string) => !v || Types.ObjectId.isValid(v) })
  createdBy?: string;

  @Prop({ type: String, validate: (v: string) => !v || Types.ObjectId.isValid(v) })
  updatedBy?: string;
}

export const FeatureFlagSchema = SchemaFactory.createForClass(FeatureFlag);
