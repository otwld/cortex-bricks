import type { FeatureFlagEvaluatorOptions } from './feature-flags.tokens';

/**
 * Default evaluator options used by built-in helpers.
 */
export const FEATURE_FLAG_EVALUATOR_DEFAULT_OPTIONS: Required<FeatureFlagEvaluatorOptions> = {
  string: { caseSensitive: false, trim: true, normalize: 'NFC' },
  number: { parseStringNumbers: true },
  boolean: { coerceCommonStrings: true },
};

/**
 * Returns true when the value is null or undefined.
 */
export const isNullish = (value: unknown): value is null | undefined => value === null || value === undefined;

/**
 * Normalizes string values for comparisons based on evaluator options.
 */
export function normalizeStringValue(value: unknown, options: Required<FeatureFlagEvaluatorOptions>['string']): string | null {
  if (isNullish(value)) return null;
  let result = String(value);
  if (options.trim) result = result.trim();
  if (!options.caseSensitive) result = result.toLocaleLowerCase();
  if (options.normalize) result = result.normalize(options.normalize);
  return result;
}

/**
 * Coerces string values into numbers when allowed by evaluator options.
 */
export function coerceNumberValue(value: unknown, options: Required<FeatureFlagEvaluatorOptions>['number']): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (options.parseStringNumbers && typeof value === 'string') {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }
  return null;
}

/**
 * Coerces common string/number representations into booleans.
 */
export function coerceBooleanValue(
  value: unknown,
  options: Required<FeatureFlagEvaluatorOptions>['boolean'],
): boolean | null {
  if (typeof value === 'boolean') return value;
  if (!options.coerceCommonStrings) return null;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'y') return true;
    if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'n') return false;
  }
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  return null;
}

/**
 * Casts a value to an array when possible.
 */
export function toArray<T>(value: unknown): T[] | null {
  return Array.isArray(value) ? (value as T[]) : null;
}

/**
 * Returns a list of values for operators that accept multiple values.
 */
export function pickValueList<T>(condition: { values?: T[]; value?: unknown }): T[] | null {
  return condition.values && Array.isArray(condition.values)
    ? (condition.values as T[])
    : Array.isArray(condition.value)
      ? (condition.value as T[])
      : null;
}

/**
 * Builds a RegExp instance safely from pattern + flags.
 */
export function buildRegex(pattern: unknown, flags?: unknown): RegExp | null {
  try {
    if (pattern instanceof RegExp) return pattern;
    if (typeof pattern === 'string') return new RegExp(pattern, typeof flags === 'string' ? flags : undefined);
  } catch {
    return null;
  }
  return null;
}
