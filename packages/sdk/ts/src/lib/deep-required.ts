/**
 * Internal type used by toolkit/ts-sdk.
 */
type Primitive = string | number | boolean | bigint | symbol | null | undefined;
/**
 * Internal type used by toolkit/ts-sdk.
 */

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
type Builtin = Primitive | Function | Date | RegExp;
/** DeepRequired. */


// DeepRequired: makes all properties required, recursively
export type DeepRequired<T> =
  // Leave builtins as-is
  T extends Builtin
    ? T
    : // Arrays & tuples
      T extends ReadonlyArray<infer U>
      ? ReadonlyArray<DeepRequired<U>>
      : T extends Array<infer U>
        ? Array<DeepRequired<U>>
        : // Maps/Sets
          T extends ReadonlyMap<infer K, infer V>
          ? ReadonlyMap<DeepRequired<K>, DeepRequired<V>>
          : T extends Map<infer K, infer V>
            ? Map<DeepRequired<K>, DeepRequired<V>>
            : T extends ReadonlySet<infer U>
              ? ReadonlySet<DeepRequired<U>>
              : T extends Set<infer U>
                ? Set<DeepRequired<U>>
                : // Objects
                  { [K in keyof T]-?: DeepRequired<T[K]> };
