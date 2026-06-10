import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import type { PrimitiveTag } from '@otwld/ts-feature-flags';
import type {
  ConditionMeta,
  ConditionMetaOperator,
  FeatureCondition,
  FeatureEvaluationResultDto as SharedFeatureFlagEvaluationResultDto,
  FeatureFlagAppContext,
  FeatureFlagDto as SharedFeatureFlagDto,
  FeatureFlagUpsertDto as SharedFeatureFlagUpsertDto,
  FeatureFlagUserContext,
  FeatureFlagVariant,
  ResolvedSubjectMeta,
} from '@otwld/ts-feature-flags';
import { FeatureScope, PRIMITIVE_TAGS } from '@otwld/ts-feature-flags';

/**
 * Shared REST request context fields for feature-flag evaluations.
 */
export class FeatureFlagContextBaseDto implements Pick<FeatureFlagAppContext, 'extra'> {
  /**
   * Additional context attributes passed through to condition resolvers.
   */
  @IsObject()
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Extra data for the context.',
    default: {},
  })
  extra: Record<string, unknown> = {};
}

/**
 * REST request context for app-scoped feature-flag evaluations.
 */
export class FeatureFlagAppContextDto extends FeatureFlagContextBaseDto implements FeatureFlagAppContext {
  /**
   * Application version used by app-scoped conditions such as version gates.
   */
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The version of the application.',
    example: '2026.2.0',
  })
  version!: string;
}

/**
 * REST request context for user-scoped feature-flag evaluations.
 */
export class FeatureFlagUserContextDto extends FeatureFlagContextBaseDto implements FeatureFlagUserContext {
  /**
   * User identifier from the consuming product's identity system.
   */
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'User identifier in your identity system.',
    example: 'candidate-42',
  })
  userId!: string;
}

/**
 * REST DTO for one supported condition operator.
 */
export class FeatureFlagConditionMetaOperatorDto implements ConditionMetaOperator {
  /**
   * Condition payload slot supplied to this operator during evaluation.
   */
  @ApiPropertyOptional({ enum: ['value', 'values', 'range'], description: 'The field that this operator targets' })
  @IsOptional()
  @IsEnum(['value', 'values', 'range'])
  field?: 'value' | 'values' | 'range';

  /**
   * Operator identifier displayed to admin clients and stored on conditions.
   */
  @ApiProperty({ description: 'The name of the operator (e.g., eq, contains)' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}

/**
 * REST DTO describing condition metadata exposed to admin clients.
 */
export class FeatureFlagConditionMetaDto implements ConditionMeta {
  /**
   * Admin-facing label for the condition attribute group.
   */
  @ApiProperty({ description: 'Display/name of the attribute group' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  /**
   * Primitive value type expected by all operators in this metadata entry.
   */
  @ApiProperty({ enum: PRIMITIVE_TAGS, enumName: 'PrimitiveTag', description: 'Primitive type of the attribute' })
  @IsEnum(PRIMITIVE_TAGS)
  type!: PrimitiveTag;

  /**
   * Operators supported for the condition attribute.
   */
  @ApiProperty({ type: () => [FeatureFlagConditionMetaOperatorDto], description: 'List of supported operators' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureFlagConditionMetaOperatorDto)
  operators!: readonly FeatureFlagConditionMetaOperatorDto[];

  /**
   * Required payload fields a client must supply when creating this condition.
   */
  @ApiProperty({ type: [String], description: 'List of required payload fields' })
  @IsArray()
  @IsString({ each: true })
  payloadFields!: readonly string[];

  /**
   * Predefined selectable values for attributes with a constrained option set.
   */
  @ApiPropertyOptional({ type: [String], description: 'List of predefined options for the attribute' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];
}

/**
 * REST DTO grouping resolved condition metadata under one feature-flag scope.
 */
export class FeatureFlagSubjectMetaDto implements ResolvedSubjectMeta {
  /**
   * Feature-flag scope that owns the returned condition metadata.
   */
  @ApiProperty({ enum: FeatureScope, enumName: 'FeatureScope', description: 'Scope of the subject' })
  @IsEnum(FeatureScope)
  @IsNotEmpty()
  scope!: FeatureScope;

  /**
   * Condition definitions available for the scope.
   */
  @ApiProperty({ type: () => [FeatureFlagConditionMetaDto], description: 'List of condition metadata' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureFlagConditionMetaDto)
  conditions!: FeatureFlagConditionMetaDto[];
}

/**
 * REST DTO for a subject-keyed condition metadata map.
 */
@ApiExtraModels(FeatureFlagSubjectMetaDto)
export class FeatureFlagConditionMetaMapDto {
  /**
   * Subject-keyed condition metadata used by admin clients to build editors.
   */
  @ApiProperty({
    description: 'Map from condition group key → meta object',
    type: 'object',
    additionalProperties: { $ref: getSchemaPath(FeatureFlagSubjectMetaDto) },
  })
  @IsObject()
  @IsNotEmpty()
  map!: Record<string, FeatureFlagSubjectMetaDto>;
}

/**
 * REST DTO for a single feature-flag targeting condition.
 */
export class FeatureFlagConditionDto implements FeatureCondition {
  /**
   * Subject namespace that selects the condition resolver.
   */
  @ApiProperty({ description: 'Discriminator for the rule engine' })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  /**
   * Attribute key compared against values from the resolved evaluation context.
   */
  @ApiProperty({ description: 'Attribute key to compare (domain depends on subject)' })
  @IsString()
  @IsNotEmpty()
  key!: string;

  /**
   * Primitive type expected for `value`, `values`, or `range` comparisons.
   */
  @ApiProperty({ enum: PRIMITIVE_TAGS, enumName: 'PrimitiveTag', description: 'Type of the value being compared' })
  @IsEnum(PRIMITIVE_TAGS)
  valueType!: PrimitiveTag;

  /**
   * Operator metadata that determines how the condition payload is interpreted.
   */
  @ApiProperty({ type: () => FeatureFlagConditionMetaOperatorDto, description: 'Operator details' })
  @ValidateNested()
  @Type(() => FeatureFlagConditionMetaOperatorDto)
  operator!: FeatureFlagConditionMetaOperatorDto;

  /**
   * Single comparison value used when the operator reads the `value` slot.
   */
  @ApiPropertyOptional({ description: 'Single value for comparison' })
  @IsOptional()
  value?: string | number | boolean;

  /**
   * Multiple comparison values used when the operator reads the `values` slot.
   */
  @ApiPropertyOptional({ description: 'Multiple values for comparison' })
  @IsOptional()
  @IsArray()
  values?: Array<string | number | boolean>;

  /**
   * Numeric range tuple supplied as `[min, max]` for range comparisons.
   */
  @ApiPropertyOptional({ required: false, description: 'Numeric range [min, max]', type: [Number] })
  @IsOptional()
  @IsArray()
  range?: [number, number];

  /**
   * Operator-specific extension payload for future condition metadata.
   */
  @ApiPropertyOptional({ required: false, description: 'Free-form extra payload', type: Object })
  @IsOptional()
  extra?: unknown;
}

/**
 * REST DTO for a named feature-flag variant.
 */
@ApiExtraModels(FeatureFlagConditionDto)
export class FeatureFlagVariantDto implements FeatureFlagVariant {
  /**
   * Stable label returned in evaluation results when this variant matches.
   */
  @ApiProperty({ description: 'Stable label for the variant.' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  /**
   * JSON payload returned for matching contexts, merged over the base payload.
   */
  @ApiPropertyOptional({
    type: Object,
    description: 'Payload returned when this variant matches. Merges over the base payload.',
  })
  @IsOptional()
  payload?: Record<string, unknown>;

  /**
   * Conditions that all must pass before the variant can be selected.
   */
  @ApiProperty({
    type: () => [FeatureFlagConditionDto],
    description: 'Conditions that must pass for this variant to match.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureFlagConditionDto)
  conditions!: Array<FeatureFlagConditionDto>;
}

/**
 * REST DTO for a complete feature-flag record returned by admin APIs.
 */
@ApiExtraModels(FeatureFlagConditionDto)
export class FeatureFlagDto implements SharedFeatureFlagDto {
  /**
   * MongoDB document id serialized for admin clients.
   */
  @ApiProperty({ description: 'MongoDB document id' })
  @IsMongoId()
  @Type(() => String)
  _id!: string;

  /**
   * Human-readable name displayed to administrators.
   */
  @ApiProperty({ description: 'Human-readable name displayed to admins.' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  /**
   * Stable kebab-case lookup key used for evaluation and mutations.
   */
  @ApiProperty({ description: 'Unique kebab-case slug (used as stable key).' })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  slug!: string;

  /**
   * Context scope that determines whether app or user evaluation inputs apply.
   */
  @ApiProperty({ enum: FeatureScope, enumName: 'FeatureScope', description: 'Scope of application for the feature.' })
  @IsEnum(FeatureScope)
  scope!: FeatureScope;

  /**
   * Global feature gate that must be true before targeting rules can enable it.
   */
  @ApiProperty({ type: Boolean, description: 'Global toggle for the feature (targeting still applies if true).' })
  @IsBoolean()
  enabled!: boolean;

  /**
   * Base JSON payload returned when the flag evaluates as enabled.
   */
  @ApiPropertyOptional({ type: Object, description: 'Arbitrary JSON payload for clients (config, copy, etc.).' })
  @IsOptional()
  payload?: Record<string, unknown>;

  /**
   * Ordered variant definitions evaluated after the base feature gates pass.
   */
  @ApiPropertyOptional({
    type: () => [FeatureFlagVariantDto],
    description: 'Ordered variants evaluated after the base feature gates pass.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureFlagVariantDto)
  variants?: Array<FeatureFlagVariantDto>;

  /**
   * Base targeting rules evaluated before allow lists and variant selection.
   */
  @ApiProperty({ type: () => [FeatureFlagConditionDto], description: 'Optional condition rules for dynamic targeting.' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureFlagConditionDto)
  conditions!: Array<FeatureFlagConditionDto>;

  /**
   * User identifiers explicitly allowed after condition checks pass.
   */
  @ApiProperty({
    type: [String],
    description: 'Explicit allow-list of user IDs (applied after conditions).',
  })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @Type(() => String)
  allowUserIds!: string[];

  /**
   * User identifiers explicitly denied last, overriding allow-list matches.
   */
  @ApiProperty({
    type: [String],
    description: 'Explicit deny-list of user IDs (applied last, overrides allows).',
  })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @Type(() => String)
  denyUserIds!: string[];

  /**
   * UTC datetime before which the flag should evaluate as disabled.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'UTC datetime when the feature starts.' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  /**
   * UTC datetime after which the flag should evaluate as disabled.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'UTC datetime when the feature ends.' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  /**
   * Identifier for the actor that created the flag, when tracked by the caller.
   */
  @ApiPropertyOptional({ type: String, description: 'User identifier of creator.' })
  @IsOptional()
  @IsString()
  createdBy?: string;

  /**
   * Identifier for the actor that most recently updated the flag.
   */
  @ApiPropertyOptional({ type: String, description: 'User identifier of last updater.' })
  @IsOptional()
  @IsString()
  updatedBy?: string;

  /**
   * UTC timestamp when the flag record was created.
   */
  @ApiProperty({ type: String, format: 'date-time', description: 'Creation datetime (UTC).' })
  @IsDateString()
  createdAt!: string;

  /**
   * UTC timestamp when the flag record last changed.
   */
  @ApiProperty({ type: String, format: 'date-time', description: 'Last update datetime (UTC).' })
  @IsDateString()
  updatedAt!: string;
}

function toUniqueStringArray(value: unknown): string[] | undefined {
  if (value == null) return undefined;
  const array = Array.isArray(value) ? value : [value];
  const normalized = array
    .map((item) => (typeof item === 'string' ? item.trim() : String(item)))
    .filter((item) => item.length > 0);
  return Array.from(new Set(normalized));
}

/**
 * REST DTO accepted when creating or replacing a feature flag.
 */
@ApiExtraModels(FeatureFlagConditionDto)
export class FeatureFlagUpsertDto implements SharedFeatureFlagUpsertDto {
  /**
   * Human-readable name used to derive the stable slug for new flags.
   */
  @ApiProperty()
  @IsString()
  name!: string;

  /**
   * Context scope that determines whether app or user evaluation inputs apply.
   */
  @ApiProperty({ enum: FeatureScope, description: 'Scope of the flag: user or app.' })
  @IsEnum(FeatureScope)
  scope!: FeatureScope;

  /**
   * Global feature gate that must be enabled before targeting can pass.
   */
  @ApiProperty({ default: false })
  @IsBoolean()
  enabled!: boolean;

  /**
   * Base JSON payload returned when the flag evaluates as enabled.
   */
  @ApiPropertyOptional({
    type: Object,
    description: 'Free-form JSON payload validated against the catalog server-side.',
  })
  @IsOptional()
  payload?: Record<string, unknown>;

  /**
   * Ordered variant definitions evaluated after base flag conditions pass.
   */
  @ApiPropertyOptional({
    type: () => [FeatureFlagVariantDto],
    description: 'Ordered variants evaluated after the base feature gates pass.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureFlagVariantDto)
  variants?: Array<FeatureFlagVariantDto>;

  /**
   * Base targeting rules evaluated before allow lists and variant selection.
   */
  @ApiProperty({ type: () => [FeatureFlagConditionDto], description: 'Feature conditions.' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureFlagConditionDto)
  conditions!: Array<FeatureFlagConditionDto>;

  /**
   * User identifiers explicitly allowed after condition checks pass.
   */
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Transform(({ value }) => toUniqueStringArray(value))
  @IsString({ each: true })
  allowUserIds?: string[];

  /**
   * User identifiers explicitly denied last, overriding allow-list matches.
   */
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Transform(({ value }) => toUniqueStringArray(value))
  @IsString({ each: true })
  denyUserIds?: string[];

  /**
   * UTC datetime before which the flag should evaluate as disabled.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  /**
   * UTC datetime after which the flag should evaluate as disabled.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;
}

/**
 * REST DTO returned after evaluating one feature flag for a context.
 */
export class FeatureFlagEvaluationResultDto implements SharedFeatureFlagEvaluationResultDto {
  /**
   * Whether this flag is enabled for the supplied evaluation context.
   */
  @ApiProperty()
  enabled!: boolean;

  /**
   * Human-readable flag name associated with the evaluation result.
   */
  @ApiProperty()
  name!: string;

  /**
   * Stable flag slug used as the client lookup key.
   */
  @ApiProperty()
  slug!: string;

  /**
   * Resolved payload returned to the client after base and variant merging.
   */
  @ApiPropertyOptional({ type: Object })
  payload?: unknown;

  /**
   * Name of the matching variant, or undefined when only the base flag matched.
   */
  @ApiPropertyOptional({ description: 'Name of the matching variant, if any.' })
  variant?: string;
}

/**
 * REST DTO accepted by the feature-flag toggle endpoint.
 */
export class FeatureFlagToggleDto {
  /**
   * New global enabled state for the feature flag.
   */
  @ApiProperty({ type: Boolean })
  @IsBoolean()
  enabled!: boolean;
}
