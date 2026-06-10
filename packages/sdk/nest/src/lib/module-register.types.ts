import type {
  DynamicModule,
  ForwardReference,
  InjectionToken,
  ModuleMetadata,
  OptionalFactoryDependency,
  Type,
} from '@nestjs/common';

export type NestFeatureModuleImport =
  | Type<unknown>
  | DynamicModule
  | ForwardReference<unknown>
  | Promise<DynamicModule>;

export type NestFeatureModuleInject = Array<
  InjectionToken | OptionalFactoryDependency
>;

export interface NestFeatureModuleFactoryProvider<T> {
  imports?: NestFeatureModuleImport[];
  useFactory: (...args: unknown[]) => Promise<T> | T;
  inject?: NestFeatureModuleInject;
}

export interface NestFeatureModuleAsyncOptions<T>
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: unknown[]) => Promise<T> | T;
  inject?: NestFeatureModuleInject;
}

export type NestFeatureModuleImportsSource =
  | NestFeatureModuleImport[]
  | Pick<ModuleMetadata, 'imports'>
  | undefined;
