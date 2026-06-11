import { type EnvironmentProviders, type Provider } from '@angular/core';
import type { ArgTypes, Decorator, Preview } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { graphql, type GraphQLQuery, type JsonBodyType, type RequestHandler, HttpResponse, http } from 'msw';
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
export type StorybookMswHandlerGroups = Record<string, RequestHandler | RequestHandler[] | null>;

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
  handlers: StorybookMswHandlerGroups = {},
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
export function defineStorybookMswHandlers<T extends StorybookMswHandlerGroups>(handlers: T): T {
  return handlers;
}

/**
 * Story-level parameter helper for MSW handlers.
 */
export function withStoryMswHandlers(handlers: StorybookMswHandlerGroups): {
  msw: { handlers: StorybookMswHandlerGroups };
} {
  return {
    msw: {
      handlers,
    },
  };
}

/**
 * Named chart input rendered through Storybook controls.
 */
export interface StorybookChartDataInput {
  readonly name: string;
  readonly description: string;
}

/**
 * Named chart output rendered through Storybook actions.
 */
export interface StorybookChartDataOutput {
  readonly name?: string;
  readonly action?: string;
  readonly description?: string;
}

/**
 * Options for shared chart story argType declarations.
 */
export interface StorybookChartArgTypesOptions {
  readonly dataInput: StorybookChartDataInput;
  readonly dataOutput?: StorybookChartDataOutput;
  readonly titleDescription?: string;
  readonly includeLabels?: boolean;
  readonly labelsDescription?: string;
  readonly includeThemeKey?: boolean;
  readonly includeColorScheme?: boolean;
  readonly includeOptions?: boolean;
  readonly includeChartClass?: boolean;
  readonly emptyMessageDescription?: string;
}

/**
 * Creates common argTypes for chart-backed Angular stories.
 */
export function createStorybookChartArgTypes(options: StorybookChartArgTypesOptions): ArgTypes {
  const argTypes: ArgTypes = {
    title: {
      control: 'text',
      description: options.titleDescription ?? 'Heading shown above the chart.',
      table: { category: 'Inputs' },
    },
    [options.dataInput.name]: {
      control: 'object',
      description: options.dataInput.description,
      table: { category: 'Inputs' },
    },
    emptyMessage: {
      control: 'text',
      description: options.emptyMessageDescription ?? 'Message shown when no chart data is available.',
      table: { category: 'Inputs' },
    },
  };

  if (options.includeLabels ?? true) {
    argTypes['labels'] = {
      control: 'object',
      description: options.labelsDescription ?? 'Labels rendered on the chart axis.',
      table: { category: 'Inputs' },
    };
  }

  if (options.includeThemeKey ?? true) {
    argTypes['themeKey'] = {
      control: false,
      description: 'External value used to trigger chart color recomputation.',
      table: { category: 'Inputs' },
    };
  }

  if (options.includeColorScheme ?? true) {
    argTypes['colorScheme'] = {
      control: 'radio',
      description: 'Theme token color scheme used for resolved chart colors.',
      options: ['light', 'dark'],
      table: { category: 'Inputs' },
    };
  }

  if (options.includeOptions ?? true) {
    argTypes['options'] = {
      control: 'object',
      description: 'Chart.js options override.',
      table: { category: 'Inputs' },
    };
  }

  if (options.includeChartClass ?? true) {
    argTypes['chartClass'] = {
      control: 'text',
      description: 'CSS class applied to the rendered chart.',
      table: { category: 'Inputs' },
    };
  }

  const dataOutput = options.dataOutput;

  if (dataOutput) {
    const outputName = dataOutput.name ?? 'dataSelected';

    argTypes[outputName] = {
      action: dataOutput.action ?? outputName,
      description: dataOutput.description ?? 'Emitted when a chart data element is selected.',
      table: { category: 'Outputs' },
    };
  }

  return argTypes;
}

type HttpResponseInit = Parameters<typeof HttpResponse.json>[1];
type JsonRequestFactory = typeof http.get;

function createStaticJsonHandler<TResponse extends JsonBodyType>(
  requestFactory: JsonRequestFactory,
  path: Parameters<JsonRequestFactory>[0],
  body: TResponse,
  init?: HttpResponseInit,
): RequestHandler {
  return requestFactory(path, () => HttpResponse.json(body, init));
}

/**
 * Creates a GET handler that always returns the provided JSON body.
 */
export function createJsonGetHandler<TResponse extends JsonBodyType>(
  path: Parameters<typeof http.get>[0],
  body: TResponse,
  init?: HttpResponseInit,
): RequestHandler {
  return createStaticJsonHandler(http.get, path, body, init);
}

/**
 * Creates a POST handler that always returns the provided JSON body.
 */
export function createJsonPostHandler<TResponse extends JsonBodyType>(
  path: Parameters<typeof http.post>[0],
  body: TResponse,
  init?: HttpResponseInit,
): RequestHandler {
  return createStaticJsonHandler(http.post, path, body, init);
}

/**
 * Creates a PUT handler that always returns the provided JSON body.
 */
export function createJsonPutHandler<TResponse extends JsonBodyType>(
  path: Parameters<typeof http.put>[0],
  body: TResponse,
  init?: HttpResponseInit,
): RequestHandler {
  return createStaticJsonHandler(http.put, path, body, init);
}

/**
 * Creates a PATCH handler that always returns the provided JSON body.
 */
export function createJsonPatchHandler<TResponse extends JsonBodyType>(
  path: Parameters<typeof http.patch>[0],
  body: TResponse,
  init?: HttpResponseInit,
): RequestHandler {
  return createStaticJsonHandler(http.patch, path, body, init);
}

/**
 * Creates a DELETE handler that always returns the provided JSON body.
 */
export function createJsonDeleteHandler<TResponse extends JsonBodyType>(
  path: Parameters<typeof http.delete>[0],
  body: TResponse,
  init?: HttpResponseInit,
): RequestHandler {
  return createStaticJsonHandler(http.delete, path, body, init);
}

/**
 * Creates a GraphQL query handler that returns a stable `data` envelope.
 */
export function createGraphqlQueryHandler<
  TData extends GraphQLQuery,
  TVariables extends Record<string, unknown> = Record<string, never>,
>(operationName: string, data: TData, init?: HttpResponseInit): RequestHandler {
  return graphql.query<TData, TVariables>(operationName, () => HttpResponse.json({ data }, init));
}

/**
 * Creates a GraphQL mutation handler that returns a stable `data` envelope.
 */
export function createGraphqlMutationHandler<
  TData extends GraphQLQuery,
  TVariables extends Record<string, unknown> = Record<string, never>,
>(operationName: string, data: TData, init?: HttpResponseInit): RequestHandler {
  return graphql.mutation<TData, TVariables>(operationName, () => HttpResponse.json({ data }, init));
}

export * from './faker-genetics';
export * from './msw-search-handler';
