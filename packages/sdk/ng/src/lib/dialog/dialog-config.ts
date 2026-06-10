export type DialogConfigWithRequiredData<
  TConfig extends { data?: unknown },
  TData,
> = Omit<TConfig, 'data'> & { data: TData };
