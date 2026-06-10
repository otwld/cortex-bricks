/** Supported feature-flag scopes. */
export type FeatureScope = 'app' | 'user';

/** Canonical list of supported feature-flag scopes. */
export const FEATURE_SCOPES = ['app', 'user'] as const;

/** Uppercase enum-like lookup for `FeatureScope` values. */
export const FeatureScope: Record<Uppercase<FeatureScope>, FeatureScope> = {
  APP: 'app',
  USER: 'user',
};
/** Stable key used to identify a feature flag across systems. */
export type FeatureFlagKey = string;

/** Declarative metadata describing a feature flag. */
export interface FeatureFlagDefinition {
  scope: FeatureScope;
  description?: string;
}
/** Catalog of known feature flags keyed by their stable name. */
export type FeatureFlagCatalog = Record<FeatureFlagKey, FeatureFlagDefinition>;

/** Shared context fields accepted by app-scoped and user-scoped evaluations. */
export interface FeatureFlagContextBase {
  extra?: Record<string, unknown>;
  headers?: Record<string, unknown>;
}

/** Context used when evaluating app-scoped feature flags. */
export interface FeatureFlagAppContext extends FeatureFlagContextBase {
  version: string;
}

/** Context used when evaluating user-scoped feature flags. */
export interface FeatureFlagUserContext extends FeatureFlagContextBase {
  userId: string;
}
/** Union of supported feature-flag evaluation contexts. */
export type FeatureFlagContext = FeatureFlagAppContext | FeatureFlagUserContext;

/** Narrow a feature-flag context to the app-scoped shape. */
export function isFeatureFlagAppContext(value: FeatureFlagContext): value is FeatureFlagAppContext {
  return !('userId' in value);
}
/** Primitive value kinds supported by condition payloads. */
export type PrimitiveTag = 'string' | 'number' | 'boolean';

/** Canonical list of supported primitive value kinds. */
export const PRIMITIVE_TAGS = ['string', 'number', 'boolean'] as const;

/** Operator metadata used to build and evaluate feature conditions. */
export interface ConditionMetaOperator {
  name: string;
  field?: 'value' | 'values' | 'range';
  disableWhenOptions?: boolean;
}

export const STRING_OPERATORS: readonly ConditionMetaOperator[] = [
  { name: 'eq', field: 'value' },
  { name: 'neq', field: 'value' },
  { name: 'startsWith', field: 'value', disableWhenOptions: true },
  { name: 'endsWith', field: 'value', disableWhenOptions: true },
  { name: 'contains', field: 'value', disableWhenOptions: true },
  { name: 'notContains', field: 'value', disableWhenOptions: true },
  { name: 'regex', field: 'value', disableWhenOptions: true },
  { name: 'lengthEq', field: 'value', disableWhenOptions: true },
  { name: 'lengthGt', field: 'value', disableWhenOptions: true },
  { name: 'lengthLt', field: 'value', disableWhenOptions: true },
  { name: 'in', field: 'values' },
  { name: 'notIn', field: 'values' },
  { name: 'isNull' },
  { name: 'isNotNull' },
] as const;

export const NUMBER_OPERATORS: readonly ConditionMetaOperator[] = [
  { name: 'eq', field: 'value' },
  { name: 'neq', field: 'value' },
  { name: 'gt', field: 'value' },
  { name: 'gte', field: 'value' },
  { name: 'lt', field: 'value' },
  { name: 'lte', field: 'value' },
  { name: 'isNull' },
  { name: 'isNotNull' },
] as const;

export const BOOLEAN_OPERATORS: readonly ConditionMetaOperator[] = [
  { name: 'isTrue' },
  { name: 'isFalse' },
] as const;

export const ALL_OPERATORS = {
  string: STRING_OPERATORS,
  number: NUMBER_OPERATORS,
  boolean: BOOLEAN_OPERATORS,
} as const;

export const STRING_PAYLOAD_FIELDS = ['value', 'values', 'extra'] as const;
export const NUMBER_PAYLOAD_FIELDS = ['value', 'values', 'range', 'extra'] as const;
export const BOOLEAN_PAYLOAD_FIELDS = ['value', 'extra'] as const;

export const ALL_PAYLOAD_FIELDS = {
  string: STRING_PAYLOAD_FIELDS,
  number: NUMBER_PAYLOAD_FIELDS,
  boolean: BOOLEAN_PAYLOAD_FIELDS,
} as const;

export interface ConditionMeta<T extends string = string, K extends PrimitiveTag = PrimitiveTag> {
  name: T;
  type: K;
  operators: readonly ConditionMetaOperator[];
  payloadFields: readonly string[];
  options?: string[];
}

export interface ConditionMetaSource<T extends string = string, K extends PrimitiveTag = PrimitiveTag> {
  name: T;
  type: K;
  operators: readonly ConditionMetaOperator[];
  payloadFields: readonly string[];
  options?: () => Promise<string[]>;
}

export interface SubjectMeta<T extends string = string, K extends PrimitiveTag = PrimitiveTag> {
  scope: FeatureScope;
  conditions: ConditionMetaSource<T, K>[];
}

export interface ResolvedSubjectMeta<T extends string = string, K extends PrimitiveTag = PrimitiveTag> {
  scope: FeatureScope;
  conditions: ConditionMeta<T, K>[];
}
/** ConditionMetaMap. */


export type ConditionMetaMap<T extends string = string, K extends PrimitiveTag = PrimitiveTag> = Record<
  T,
  SubjectMeta<T, K>
>;
/** ResolvedConditionMetaMap. */


export type ResolvedConditionMetaMap<T extends string = string, K extends PrimitiveTag = PrimitiveTag> = Record<
  T,
  ResolvedSubjectMeta<T, K>
>;

export function createConditionMetaKey<K extends string = string>(
  key: K,
  type: PrimitiveTag,
  options?: () => Promise<string[]>,
  operators?: ConditionMetaOperator[],
  payloadFields?: string[],
): ConditionMetaSource<K> {
  return {
    name: key,
    type,
    payloadFields: payloadFields || ALL_PAYLOAD_FIELDS[type],
    operators: options
      ? (operators || ALL_OPERATORS[type]).filter(({ disableWhenOptions }) => disableWhenOptions !== true)
      : operators || ALL_OPERATORS[type],
    options,
  };
}

export function createSubject<K extends string = string>(
  subject: Omit<SubjectMeta<K>, 'conditions'> & { conditions: Record<K, ConditionMetaSource<K>> },
): SubjectMeta<K> {
  return {
    ...subject,
    conditions: Object.values(subject.conditions),
  };
}

export interface FeatureCondition {
  subject: string;
  key: string;
  valueType: PrimitiveTag;
  operator: ConditionMetaOperator;
  value?: string | number | boolean;
  values?: Array<string | number | boolean>;
  range?: [number, number];
  extra?: unknown;
}

export interface FeatureFlagVariant {
  conditions: FeatureCondition[];
  name: string;
  payload?: Record<string, unknown>;
}

export interface FeatureFlagDto {
  _id: string;
  name: string;
  slug: string;
  scope: FeatureScope;
  enabled: boolean;
  payload?: Record<string, unknown>;
  variants?: FeatureFlagVariant[];
  conditions: FeatureCondition[];
  allowUserIds: string[];
  denyUserIds: string[];
  startsAt?: string;
  endsAt?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlagUpsertDto {
  name: string;
  scope: FeatureScope;
  enabled: boolean;
  payload?: Record<string, unknown>;
  variants?: FeatureFlagVariant[];
  conditions: FeatureCondition[];
  allowUserIds?: string[];
  denyUserIds?: string[];
  startsAt?: string;
  endsAt?: string;
}

export interface FeatureEvaluationResultDto {
  enabled: boolean;
  name: string;
  slug: string;
  payload?: unknown;
  variant?: string;
}
