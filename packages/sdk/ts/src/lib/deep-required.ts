/** Primitive values that should not be traversed by `DeepRequired`. */
type Primitive = string | number | boolean | bigint | symbol | null | undefined;

/** Function values should remain callable instead of becoming required objects. */
type BuiltinFunction = (...args: never[]) => unknown;

/** Makes every nested object property required while leaving built-in values unchanged. */
export type DeepRequired<T> =
  T extends Builtin
    ? T
    : T extends ReadonlyArray<infer U>
      ? ReadonlyArray<DeepRequired<U>>
      : T extends Array<infer U>
        ? Array<DeepRequired<U>>
        : T extends ReadonlyMap<infer K, infer V>
          ? ReadonlyMap<DeepRequired<K>, DeepRequired<V>>
          : T extends Map<infer K, infer V>
            ? Map<DeepRequired<K>, DeepRequired<V>>
            : T extends ReadonlySet<infer U>
              ? ReadonlySet<DeepRequired<U>>
              : T extends Set<infer U>
                ? Set<DeepRequired<U>>
                : { [K in keyof T]-?: DeepRequired<T[K]> };

type Builtin = Primitive | BuiltinFunction | Date | RegExp;
