import { effect } from '@angular/core';
import { CreateQueryResult } from '@tanstack/angular-query-experimental';

export function queryToPromise<TData, TError>(query: CreateQueryResult<TData, TError>): Promise<NonNullable<TData>> {
  return new Promise((resolve, reject) => {
    let settled = false;
    effect(() => {
      if (settled) return;
      const data = query.data();

      if (query.isPending()) {
        // do nothing
      } else if (query.isError()) {
        settled = true;
        reject(query.error());
      } else if (query.isSuccess() && data !== null && data !== undefined) {
        settled = true;
        resolve(data);
      }
    });
  });
}
