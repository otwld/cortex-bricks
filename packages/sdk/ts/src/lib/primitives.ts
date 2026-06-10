/** Primitive. */
export type Primitive = string | number | boolean | bigint | symbol | null | undefined | Date;
/** NonUndefined. */

export type NonUndefined<T> = Exclude<T, undefined>;
