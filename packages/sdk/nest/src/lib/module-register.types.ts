import type {
  DynamicModule,
  ForwardReference,
  InjectionToken,
  ModuleMetadata,
  OptionalFactoryDependency,
  Type,
} from '@nestjs/common';

/**
 * Module import shapes accepted by Cortex Nest feature-module factories.
 *
 * This mirrors the practical subset of Nest's `imports` metadata while keeping
 * source-brick helper signatures independent from a concrete module class.
 */
export type NestFeatureModuleImport =
  | Type<unknown>
  | DynamicModule
  | ForwardReference<unknown>
  | Promise<DynamicModule>;

/**
 * Dependency tokens accepted by async feature-module factory providers.
 */
export type NestFeatureModuleInject = Array<
  InjectionToken | OptionalFactoryDependency
>;

/**
 * Async provider definition for feature options registered by a Nest module.
 */
export interface NestFeatureModuleFactoryProvider<T> {
  imports?: NestFeatureModuleImport[];
  useFactory: (...args: unknown[]) => Promise<T> | T;
  inject?: NestFeatureModuleInject;
}

/**
 * Public async options shape consumed by `registerAsync`-style feature modules.
 */
export interface NestFeatureModuleAsyncOptions<T>
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: unknown[]) => Promise<T> | T;
  inject?: NestFeatureModuleInject;
}

/**
 * Input shape accepted when collecting imports from arrays and module metadata.
 */
export type NestFeatureModuleImportsSource =
  | NestFeatureModuleImport[]
  | Pick<ModuleMetadata, 'imports'>
  | undefined;
