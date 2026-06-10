/**
 * String-indexed lookup for values where keys are dynamic runtime names.
 */
export interface StringMap<T> {
  [key: string]: T;
}

/**
 * Number-indexed lookup for values addressed by numeric IDs or positions.
 */
export interface NumberMap<T> {
  [key: number]: T;
}

/**
 * Serializable key/value pair used when map-like data must be represented as
 * an ordered array.
 */
export interface KeyValuePair<TKey, TValue> {
  key: TKey;
  value: TValue;
}

/**
 * Maps every property in a source object shape to the same result type.
 */
export type PropertyMap<TSource, TResult> = { [TProperty in keyof TSource]: TResult };

/**
 * Converts one source value into a result value.
 */
export type Mapper<TSource, TResult> = (value: TSource) => TResult;

/**
 * Optional per-property mapper table keyed by the source object properties.
 */
export type PropertyMapper<TSource, TResult> = { [TProperty in keyof TSource]?: Mapper<TSource[TProperty], TResult> };

/**
 * Field-selection list that accepts known keys plus runtime-provided field
 * names.
 */
export type FieldsOf<T> = (keyof T | string)[];
