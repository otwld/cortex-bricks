import {
  QueryClient,
  QueryFunctionContext,
} from '@tanstack/angular-query-experimental';
import { coerceQueryOptions } from './coerce-query-options';

describe(coerceQueryOptions.name, () => {
  it('exposes plain array input as static initial query data', async () => {
    const rows = [{ id: 'candidate-1' }, { id: 'candidate-2' }];
    const context: QueryFunctionContext<['candidates']> = {
      client: new QueryClient(),
      queryKey: ['candidates'],
      signal: new AbortController().signal,
      meta: undefined,
    };

    const options = coerceQueryOptions(rows, { queryKey: ['candidates'] });
    const queryFn = options.queryFn;

    expect(options.queryKey).toEqual(['candidates']);
    expect(options.enabled).toBe(false);
    expect(options.initialData).toEqual(rows);
    expect(queryFn).toEqual(expect.any(Function));
    if (typeof queryFn !== 'function') {
      throw new Error('Static query options must include a query function.');
    }
    await expect(queryFn(context)).resolves.toEqual(rows);
  });
});
