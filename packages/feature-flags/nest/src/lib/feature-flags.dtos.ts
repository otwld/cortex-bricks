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

export class FeatureFlagContextBaseDto implements Pick<FeatureFlagAppContext, 'extra'> {
  @IsObject()
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Extra data for the context.',
    default: {},
  })
  extra: Record<string, unknown> = {};
}

export class FeatureFlagAppContextDto extends FeatureFlagContextBaseDto implements FeatureFlagAppContext {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The version of the application.',
    example: '2026.2.0',
  })
  version!: string;
}

export class FeatureFlagUserContextDto extends FeatureFlagContextBaseDto implements FeatureFlagUserContext {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'User identifier in your identity system.',
    example: 'candidate-42',
  })
  userId!: string;
}

export class FeatureFlagConditionMetaOperatorDto implements ConditionMetaOperator {
  @ApiPropertyOptional({ enum: ['value', 'values', 'range'], description: 'The field that this operator targets' })
  @IsOptional()
  @IsEnum(['value', 'values', 'range'])
  field?: 'value' | 'values' | 'range';

  @ApiProperty({ description: 'The name of the operator (e.g., eq, contains)' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class FeatureFlagConditionMetaDto implements ConditionMeta {
  @ApiProperty({ description: 'Display/name of the attribute group' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: PRIMITIVE_TAGS, enumName: 'PrimitiveTag', description: 'Primitive type of the attribute' })
  @IsEnum(PRIMITIVE_TAGS)
  type!: PrimitiveTag;

  @ApiProperty({ type: () => [FeatureFlagConditionMetaOperatorDto], description: 'List of supported operators' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureFlagConditionMetaOperatorDto)
  operators!: readonly FeatureFlagConditionMetaOperatorDto[];

  @ApiProperty({ type: [String], description: 'List of required payload fields' })
  @IsArray()
  @IsString({ each: true })
  payloadFields!: readonly string[];

  @ApiPropertyOptional({ type: [String], description: 'List of predefined options for the attribute' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];
}

export class FeatureFlagSubjectMetaDto implements ResolvedSubjectMeta {
  @ApiProperty({ enum: FeatureScope, enumName: 'FeatureScope', description: 'Scope of the subject' })
  @IsEnum(FeatureScope)
  @IsNotEmpty()
  scope!: FeatureScope;

  @ApiProperty({ type: () => [FeatureFlagConditionMetaDto], description: 'List of condition metadata' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureFlagConditionMetaDto)
  conditions!: FeatureFlagConditionMetaDto[];
}

@ApiExtraModels(FeatureFlagSubjectMetaDto)
export class FeatureFlagConditionMetaMapDto {
  @ApiProperty({
    description: 'Map from condition group key → meta object',
    type: 'object',
    additionalProperties: { $ref: getSchemaPath(FeatureFlagSubjectMetaDto) },
  })
  @IsObject()
  @IsNotEmpty()
  map!: Record<string, FeatureFlagSubjectMetaDto>;
}

export class FeatureFlagConditionDto implements FeatureCondition {
  @ApiProperty({ description: 'Discriminator for the rule engine' })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiProperty({ description: 'Attribute key to compare (domain depends on subject)' })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty({ enum: PRIMITIVE_TAGS, enumName: 'PrimitiveTag', description: 'Type of the value being compared' })
  @IsEnum(PRIMITIVE_TAGS)
  valueType!: PrimitiveTag;

  @ApiProperty({ type: () => FeatureFlagConditionMetaOperatorDto, description: 'Operator details' })
  @ValidateNested()
  @Type(() => FeatureFlagConditionMetaOperatorDto)
  operator!: FeatureFlagConditionMetaOperatorDto;

  @ApiPropertyOptional({ description: 'Single value for comparison' })
  @IsOptional()
  value?: string | number | boolean;

  @ApiPropertyOptional({ description: 'Multiple values for comparison' })
  @IsOptional()
  @IsArray()
  values?: Array<string | number | boolean>;

  @ApiPropertyOptional({ required: false, description: 'Numeric range [min, max]', type: [Number] })
  @IsOptional()
  @IsArray()
  range?: [number, number];

  @ApiPropertyOptional({ required: false, description: 'Free-form extra payload', type: Object })
  @IsOptional()
  extra?: unknown;
}

@ApiExtraModels(FeatureFlagConditionDto)
export class FeatureFlagVariantDto implements FeatureFlagVariant {
  @ApiProperty({ description: 'Stable label for the variant.' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    type: Object,
    description: 'Payload returned when this variant matches. Merges over the base payload.',
  })
  @IsOptional()
  payload?: Record<string, unknown>;

  @ApiProperty({
    type: () => [FeatureFlagConditionDto],
    description: 'Conditions that must pass for this variant to match.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureFlagConditionDto)
  conditions!: Array<FeatureFlagConditionDto>;
}

@ApiExtraModels(FeatureFlagConditionDto)
export class FeatureFlagDto implements SharedFeatureFlagDto {
  @ApiProperty({ description: 'MongoDB document id' })
  @IsMongoId()
  @Type(() => String)
  _id!: string;

  @ApiProperty({ description: 'Human-readable name displayed to admins.' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @ApiProperty({ description: 'Unique kebab-case slug (used as stable key).' })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  slug!: string;

  @ApiProperty({ enum: FeatureScope, enumName: 'FeatureScope', description: 'Scope of application for the feature.' })
  @IsEnum(FeatureScope)
  scope!: FeatureScope;

  @ApiProperty({ type: Boolean, description: 'Global toggle for the feature (targeting still applies if true).' })
  @IsBoolean()
  enabled!: boolean;

  @ApiPropertyOptional({ type: Object, description: 'Arbitrary JSON payload for clients (config, copy, etc.).' })
  @IsOptional()
  payload?: Record<string, unknown>;

  @ApiPropertyOptional({
    type: () => [FeatureFlagVariantDto],
    description: 'Ordered variants evaluated after the base feature gates pass.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureFlagVariantDto)
  variants?: Array<FeatureFlagVariantDto>;

  @ApiProperty({ type: () => [FeatureFlagConditionDto], description: 'Optional condition rules for dynamic targeting.' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureFlagConditionDto)
  conditions!: Array<FeatureFlagConditionDto>;

  @ApiProperty({
    type: [String],
    description: 'Explicit allow-list of user IDs (applied after conditions).',
  })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @Type(() => String)
  allowUserIds!: string[];

  @ApiProperty({
    type: [String],
    description: 'Explicit deny-list of user IDs (applied last, overrides allows).',
  })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @Type(() => String)
  denyUserIds!: string[];

  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'UTC datetime when the feature starts.' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'UTC datetime when the feature ends.' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({ type: String, description: 'User identifier of creator.' })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiPropertyOptional({ type: String, description: 'User identifier of last updater.' })
  @IsOptional()
  @IsString()
  updatedBy?: string;

  @ApiProperty({ type: String, format: 'date-time', description: 'Creation datetime (UTC).' })
  @IsDateString()
  createdAt!: string;

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

@ApiExtraModels(FeatureFlagConditionDto)
export class FeatureFlagUpsertDto implements SharedFeatureFlagUpsertDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ enum: FeatureScope, description: 'Scope of the flag: user or app.' })
  @IsEnum(FeatureScope)
  scope!: FeatureScope;

  @ApiProperty({ default: false })
  @IsBoolean()
  enabled!: boolean;

  @ApiPropertyOptional({
    type: Object,
    description: 'Free-form JSON payload validated against the catalog server-side.',
  })
  @IsOptional()
  payload?: Record<string, unknown>;

  @ApiPropertyOptional({
    type: () => [FeatureFlagVariantDto],
    description: 'Ordered variants evaluated after the base feature gates pass.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureFlagVariantDto)
  variants?: Array<FeatureFlagVariantDto>;

  @ApiProperty({ type: () => [FeatureFlagConditionDto], description: 'Feature conditions.' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureFlagConditionDto)
  conditions!: Array<FeatureFlagConditionDto>;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Transform(({ value }) => toUniqueStringArray(value))
  @IsString({ each: true })
  allowUserIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Transform(({ value }) => toUniqueStringArray(value))
  @IsString({ each: true })
  denyUserIds?: string[];

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;
}

export class FeatureFlagEvaluationResultDto implements SharedFeatureFlagEvaluationResultDto {
  @ApiProperty()
  enabled!: boolean;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional({ type: Object })
  payload?: unknown;

  @ApiPropertyOptional({ description: 'Name of the matching variant, if any.' })
  variant?: string;
}

export class FeatureFlagToggleDto {
  @ApiProperty({ type: Boolean })
  @IsBoolean()
  enabled!: boolean;
}
