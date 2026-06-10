/**
 * Internal type used by toolkit/ts-sdk.
 */
type Primitive = string | number | boolean | bigint | symbol | null | undefined | Date;
/**
 * Internal type used by toolkit/ts-sdk.
 */


type Join<P extends string, K extends string> = P extends '' ? K : `${P}.${K}`;

/**
 * Computes dot-notation paths for nested object properties.
 */
export type NestedPath<T, Prefix extends string = ''> = T extends Primitive
  ? never
  : {
      [K in Extract<keyof T, string>]: T[K] extends Primitive
        ? Join<Prefix, K>
        : Join<Prefix, K> | NestedPath<T[K], Join<Prefix, K>>;
    }[Extract<keyof T, string>];
