export interface StringMap<T> {
  [key: string]: T;
}

export interface NumberMap<T> {
  [key: number]: T;
}

export interface KeyValuePair<TKey, TValue> {
  key: TKey;
  value: TValue;
}
/** PropertyMap. */


export type PropertyMap<TSource, TResult> = { [TProperty in keyof TSource]: TResult };
/** Mapper. */


export type Mapper<TSource, TResult> = (value: TSource) => TResult;
/** PropertyMapper. */


export type PropertyMapper<TSource, TResult> = { [TProperty in keyof TSource]?: Mapper<TSource[TProperty], TResult> };
/** FieldsOf. */


export type FieldsOf<T> = (keyof T | string)[];
