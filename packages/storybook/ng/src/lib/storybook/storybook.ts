import { Provider } from '@angular/core';
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
 * Returns a Storybook Angular decorator that registers the given providers
 * at the application level (for standalone stories).
 */
export function withStorybookProviders(providers: Provider[]): Decorator {
  return applicationConfig({ providers });
}

/**
 * Named MSW handler groups accepted by Storybook preview and story helpers.
 */
export type StorybookMswHandlerGroups = Record<
  string,
  RequestHandler | RequestHandler[] | null
>;

/**
 * is Msw Initialized definition used across Cortex libraries.
 * For example, support recruiter and candidate workflows in the job-board universe.
 */
let isMswInitialized = false;

/**
 * ensure Msw Initialized operation used across Cortex libraries.
 * For example, support recruiter and candidate workflows in the job-board universe.
 */
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

/**
 * create Json Get Handler operation used across Cortex libraries.
 * For example, support recruiter and candidate workflows in the job-board universe.
 */
export function createJsonGetHandler<TResponse extends JsonBodyType>(
  path: Parameters<typeof http.get>[0],
  body: TResponse,
  init?: HttpResponseInit
): RequestHandler {
  return http.get(path, () => HttpResponse.json(body, init));
}

/**
 * create Json Post Handler operation used across Cortex libraries.
 * For example, support recruiter and candidate workflows in the job-board universe.
 */
export function createJsonPostHandler<TResponse extends JsonBodyType>(
  path: Parameters<typeof http.post>[0],
  body: TResponse,
  init?: HttpResponseInit
): RequestHandler {
  return http.post(path, () => HttpResponse.json(body, init));
}

/**
 * create Json Put Handler operation used across Cortex libraries.
 * For example, support recruiter and candidate workflows in the job-board universe.
 */
export function createJsonPutHandler<TResponse extends JsonBodyType>(
  path: Parameters<typeof http.put>[0],
  body: TResponse,
  init?: HttpResponseInit
): RequestHandler {
  return http.put(path, () => HttpResponse.json(body, init));
}

/**
 * create Json Patch Handler operation used across Cortex libraries.
 * For example, support recruiter and candidate workflows in the job-board universe.
 */
export function createJsonPatchHandler<TResponse extends JsonBodyType>(
  path: Parameters<typeof http.patch>[0],
  body: TResponse,
  init?: HttpResponseInit
): RequestHandler {
  return http.patch(path, () => HttpResponse.json(body, init));
}

/**
 * create Json Delete Handler operation used across Cortex libraries.
 * For example, support recruiter and candidate workflows in the job-board universe.
 */
export function createJsonDeleteHandler<TResponse extends JsonBodyType>(
  path: Parameters<typeof http.delete>[0],
  body: TResponse,
  init?: HttpResponseInit
): RequestHandler {
  return http.delete(path, () => HttpResponse.json(body, init));
}

/**
 * create Graphql Query Handler operation used across Cortex libraries.
 * For example, search candidates by skill and paginate results for recruiter dashboards.
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
 * create Graphql Mutation Handler operation used across Cortex libraries.
 * For example, support recruiter and candidate workflows in the job-board universe.
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
