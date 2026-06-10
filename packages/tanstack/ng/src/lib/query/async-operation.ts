import { Observable, isObservable, lastValueFrom } from 'rxjs';
/** AsyncOperation. */


export type AsyncOperation<T> = Promise<T> | Observable<T>;

/**
 * Normalizes an operation that may return a Promise or an Observable into a Promise.
 */
export async function resolveAsyncOperation<T>(value: AsyncOperation<T>): Promise<T> {
  return isObservable(value) ? await lastValueFrom(value) : await value;
}
