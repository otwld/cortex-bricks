import { Provider, ProviderToken, Type } from '@angular/core';

/**
 * Internal type used by libs/ng/cdk.
 */
type ControlsOf<T> = T extends { controls: infer TControls } ? TControls : never;

/**
 * Internal type used by libs/ng/cdk.
 */
type IsControlsCompatible<TMain, TAlias> =
  ControlsOf<TMain> extends ControlsOf<TAlias> ? true : false;

/**
 * Internal type used by libs/ng/cdk.
 */
type EnsureAliasesCompatible<
  TMain,
  TAliases extends readonly ProviderToken<unknown>[],
> = {
  [K in keyof TAliases]: TAliases[K] extends ProviderToken<infer TAlias>
    ? IsControlsCompatible<TMain, TAlias> extends true
      ? TAliases[K]
      : never
    : never;
};

/**
 * Defines how to provide the main form service instance.
 */
export type FormServiceProvide<TService> =
  | { useClass: Type<TService> }
  | { useExisting: ProviderToken<TService> }
  | {
      useFactory: (...args: unknown[]) => TService;
      deps: ProviderToken<unknown>[];
    };

/**
 * Defines a provider alias that adapts or re-exports the main service.
 */
export type FormServiceAdapter<TProvide> = {
  provide: ProviderToken<TProvide>;
  useFactory: (...args: unknown[]) => TProvide;
  deps: ProviderToken<unknown>[];
};

/**
 * Builds a provider array for form services with optional aliasing and adapters.
 *
 * Required aliases are compile-time checked to ensure compatible `controls` shape.
 */
export function formServiceProvide<
  TMain,
  TRequiredAliases extends readonly ProviderToken<unknown>[] = readonly [],
>(
  mainToken: ProviderToken<TMain>,
  main: FormServiceProvide<TMain>,
  options?: {
    /**
     * Strict aliases (compile-time): main.controls must include alias.controls.
     * Use this for mandatory composition like Shares -> Connect.
     */
    requiredAlsoProvide?: EnsureAliasesCompatible<TMain, TRequiredAliases>;

    /**
     * Loose aliases (runtime only): additional tokens to alias to the same instance.
     * Use this for opt-in or advanced overrides.
     */
    alsoProvide?: readonly ProviderToken<unknown>[];

    /**
     * Additional adapters that derive a provider from the main instance.
     */
    adapters?: readonly FormServiceAdapter<unknown>[];

    /**
     * Extra providers to append to the output array.
     */
    extraProviders?: readonly Provider[];
  },
): Provider[] {
  const mainProvider: Provider =
    'useClass' in main
      ? { provide: mainToken, useClass: main.useClass }
      : 'useExisting' in main
        ? { provide: mainToken, useExisting: main.useExisting }
        : { provide: mainToken, useFactory: main.useFactory, deps: main.deps };

  const required = (options?.requiredAlsoProvide ??
    []) as readonly ProviderToken<unknown>[];
  const loose = options?.alsoProvide ?? [];

  const alsoProviders: Provider[] = [...required, ...loose].map((token) => ({
    provide: token,
    useExisting: mainToken,
  }));

  const adapterProviders: Provider[] = (options?.adapters ?? []).map((adapter) => ({
    provide: adapter.provide,
    useFactory: adapter.useFactory,
    deps: adapter.deps,
  }));

  return [
    mainProvider,
    ...alsoProviders,
    ...adapterProviders,
    ...(options?.extraProviders ?? []),
  ];
}
