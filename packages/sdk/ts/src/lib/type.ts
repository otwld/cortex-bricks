/**
 * Creates a typed placeholder value for APIs that need a compile-time-only
 * generic witness.
 *
 * The returned object has no runtime data and should not be read for behavior;
 * it exists only to carry `T` through inference-sensitive helper calls.
 */
export function type<T>() {
  return {} as unknown as T;
}
