/**
 * Replaces an optional dialog `data` property with a required data payload.
 *
 * Use this helper when a specific dialog component cannot render without
 * caller-provided data.
 */
export type DialogConfigWithRequiredData<
  TConfig extends { data?: unknown },
  TData,
> = Omit<TConfig, 'data'> & { data: TData };
