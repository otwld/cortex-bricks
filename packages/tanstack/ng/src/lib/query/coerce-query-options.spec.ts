import { coerceQueryOptions } from './coerce-query-options';

describe(coerceQueryOptions.name, () => {
  it('exposes plain array input as static initial query data', async () => {
    const rows = [{ id: 'candidate-1' }, { id: 'candidate-2' }];

    const options = coerceQueryOptions(rows, { queryKey: ['candidates'] });

    expect(options.queryKey).toEqual(['candidates']);
    expect(options.enabled).toBe(false);
    expect(options.initialData).toEqual(rows);
    expect(options.queryFn).toEqual(expect.any(Function));
    await expect((options.queryFn as (context: never) => Promise<typeof rows>)({} as never)).resolves.toEqual(rows);
  });
});
