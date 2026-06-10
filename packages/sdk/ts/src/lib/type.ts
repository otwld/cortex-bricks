/**
 * Creates a compile-time-only generic witness for inference-sensitive APIs.
 *
 * This helper exists only to carry `T` through inference-sensitive helper
 * calls. Calling it at runtime is a programming error.
 */
export function type<T>(): T {
  throw new Error('type<T>() is a compile-time-only helper and has no runtime value.');
}
