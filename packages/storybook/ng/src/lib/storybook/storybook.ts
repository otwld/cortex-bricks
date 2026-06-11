import { type EnvironmentProviders, type Provider } from '@angular/core';
import type { Decorator, Preview } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import {
  graphql,
  type GraphQLQuery,
  type JsonBodyType,
  type RequestHandler,
  HttpResponse,
  http,
} from 'msw';
import { initialize, mswLoader } from 'msw-storybook-addon';

/**
 * Returns a Storybook Angular decorator that registers application-level
 * providers for standalone stories.
 */
export function withStorybookProviders(providers: Array<Provider | EnvironmentProviders>): Decorator {
  return applicationConfig({ providers });
}

/**
 * Named MSW handler groups consumed by `msw-storybook-addon`.
 *
 * Group names keep preview-level handlers and story-specific overrides
 * composable without forcing every story to rebuild the full handler list.
 */
export type StorybookMswHandlerGroups = Record<
  string,
  RequestHandler | RequestHandler[] | null
>;

let isMswInitialized = false;

function ensureMswInitialized(): void {
  if (isMswInitialized) {
    return;
  }

  initialize();
  isMswInitialized = true;
}

/**
 * Creates the preview-level MSW config (loader + global handler groups).
 */
export function createStorybookMswPreview(
  handlers: StorybookMswHandlerGroups = {}
): Pick<Preview, 'loaders' | 'parameters'> {
  ensureMswInitialized();

  return {
    loaders: [mswLoader],
    parameters: {
      msw: {
        handlers,
      },
    },
  };
}

/**
 * Identity helper for typed/global handler group declarations.
 */
export function defineStorybookMswHandlers<T extends StorybookMswHandlerGroups>(
  handlers: T
): T {
  return handlers;
}

/**
 * Story-level parameter helper for MSW handlers.
 */
export function withStoryMswHandlers(
  handlers: StorybookMswHandlerGroups
): { msw: { handlers: StorybookMswHandlerGroups } } {
  return {
    msw: {
      handlers,
    },
  };
}

type HttpResponseInit = Parameters<typeof HttpResponse.json>[1];
type JsonRequestFactory = typeof http.get;

function createStaticJsonHandler<TResponse extends JsonBodyType>(
  requestFactory: JsonRequestFactory,
  path: Parameters<JsonRequestFactory>[0],
  body: TResponse,
  init?: HttpResponseInit
): RequestHandler {
  return requestFactory(path, () => HttpResponse.json(body, init));
}

/**
 * Creates a GET handler that always returns the provided JSON body.
 */
export function createJsonGetHandler<TResponse extends JsonBodyType>(
  path: Parameters<typeof http.get>[0],
  body: TResponse,
  init?: HttpResponseInit
): RequestHandler {
  return createStaticJsonHandler(http.get, path, body, init);
}

/**
 * Creates a POST handler that always returns the provided JSON body.
 */
export function createJsonPostHandler<TResponse extends JsonBodyType>(
  path: Parameters<typeof http.post>[0],
  body: TResponse,
  init?: HttpResponseInit
): RequestHandler {
  return createStaticJsonHandler(http.post, path, body, init);
}

/**
 * Creates a PUT handler that always returns the provided JSON body.
 */
export function createJsonPutHandler<TResponse extends JsonBodyType>(
  path: Parameters<typeof http.put>[0],
  body: TResponse,
  init?: HttpResponseInit
): RequestHandler {
  return createStaticJsonHandler(http.put, path, body, init);
}

/**
 * Creates a PATCH handler that always returns the provided JSON body.
 */
export function createJsonPatchHandler<TResponse extends JsonBodyType>(
  path: Parameters<typeof http.patch>[0],
  body: TResponse,
  init?: HttpResponseInit
): RequestHandler {
  return createStaticJsonHandler(http.patch, path, body, init);
}

/**
 * Creates a DELETE handler that always returns the provided JSON body.
 */
export function createJsonDeleteHandler<TResponse extends JsonBodyType>(
  path: Parameters<typeof http.delete>[0],
  body: TResponse,
  init?: HttpResponseInit
): RequestHandler {
  return createStaticJsonHandler(http.delete, path, body, init);
}

/**
 * Creates a GraphQL query handler that returns a stable `data` envelope.
 */
export function createGraphqlQueryHandler<
  TData extends GraphQLQuery,
  TVariables extends Record<string, unknown> = Record<string, never>
>(
  operationName: string,
  data: TData,
  init?: HttpResponseInit
): RequestHandler {
  return graphql.query<TData, TVariables>(operationName, () =>
    HttpResponse.json({ data }, init)
  );
}

/**
 * Creates a GraphQL mutation handler that returns a stable `data` envelope.
 */
export function createGraphqlMutationHandler<
  TData extends GraphQLQuery,
  TVariables extends Record<string, unknown> = Record<string, never>
>(
  operationName: string,
  data: TData,
  init?: HttpResponseInit
): RequestHandler {
  return graphql.mutation<TData, TVariables>(operationName, () =>
    HttpResponse.json({ data }, init)
  );
}

export * from './faker-genetics';
export * from './msw-search-handler';
