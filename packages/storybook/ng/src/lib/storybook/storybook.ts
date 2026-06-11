import { Location } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { type EnvironmentProviders, makeEnvironmentProviders, type Provider } from '@angular/core';
import { provideRouter, Router, type RouterFeatures, type Routes, withDisabledInitialNavigation } from '@angular/router';
import type { ArgTypes, Decorator, Preview } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { graphql, type GraphQLQuery, type JsonBodyType, type RequestHandler, HttpResponse, http } from 'msw';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { providePrimeNG, type PrimeNGConfigType } from 'primeng/config';
import { EMPTY } from 'rxjs';

const STORYBOOK_PRIMENG_DARK_CLASS = 'app-dark';
const STORYBOOK_THEME_MODE_GLOBAL = 'themeMode';
const STORYBOOK_VIEWPORT_MODE_GLOBAL = 'viewportMode';

const storybookViewportWidths = {
  responsive: null,
  mobile: '390px',
  tablet: '768px',
  desktop: '1280px',
} as const;

/**
 * Supported Storybook theme modes for PrimeNG and Tailwind stories.
 */
export type StorybookThemeMode = 'light' | 'dark' | 'system';

/**
 * Supported viewport markers for stories that need viewport-aware styling.
 */
export type StorybookViewportMode = keyof typeof storybookViewportWidths;

/**
 * Options for common Angular application providers used by stories.
 */
export interface StorybookAngularAppProviderOptions {
  readonly includeHttpClient?: boolean;
  readonly providers?: Array<Provider | EnvironmentProviders>;
  readonly routerFeatures?: RouterFeatures[];
  readonly routes?: Routes;
}

/**
 * Options for PrimeNG theme setup in Storybook.
 */
export interface StorybookPrimeNgThemeOptions {
  readonly config?: Omit<PrimeNGConfigType, 'theme'>;
  readonly cssLayer?:
    | false
    | {
        readonly name: string;
        readonly order: string;
      };
  readonly darkModeSelector?: string;
  readonly options?: Record<string, unknown>;
  readonly preset: unknown;
}

/**
 * Options for the PrimeNG/Tailwind theme-mode Storybook decorator.
 */
export interface StorybookThemeModeDecoratorOptions {
  readonly className?: string;
  readonly defaultMode?: StorybookThemeMode;
  readonly fallbackSystemDarkMode?: boolean;
  readonly globalName?: string;
}

/**
 * Options for the viewport-marker Storybook decorator.
 */
export interface StorybookViewportModeDecoratorOptions {
  readonly defaultMode?: StorybookViewportMode;
  readonly globalName?: string;
  readonly widths?: Partial<Record<StorybookViewportMode, string | null>>;
}

interface StorybookRouterDouble extends Partial<Router> {
  readonly resetRootComponentType: () => void;
  readonly setUpLocationChangeListener: () => void;
}

/**
 * Toolbar global types for switching PrimeNG and Tailwind theme mode.
 */
export const storybookPrimeNgThemeGlobalTypes = {
  [STORYBOOK_THEME_MODE_GLOBAL]: {
    defaultValue: 'dark',
    description: 'PrimeNG and Tailwind theme mode',
    name: 'Theme',
    toolbar: {
      dynamicTitle: true,
      icon: 'mirror',
      items: [
        { title: 'Light', value: 'light' },
        { title: 'Dark', value: 'dark' },
        { title: 'System', value: 'system' },
      ],
    },
  },
} as const;

/**
 * Toolbar global types for marking the active viewport mode.
 */
export const storybookViewportGlobalTypes = {
  [STORYBOOK_VIEWPORT_MODE_GLOBAL]: {
    defaultValue: 'responsive',
    description: 'Story viewport marker',
    name: 'Viewport',
    toolbar: {
      dynamicTitle: true,
      icon: 'mobile',
      items: [
        { title: 'Responsive', value: 'responsive' },
        { title: 'Mobile', value: 'mobile' },
        { title: 'Tablet', value: 'tablet' },
        { title: 'Desktop', value: 'desktop' },
      ],
    },
  },
} as const;

/**
 * Returns a Storybook Angular decorator that registers application-level
 * providers for standalone stories.
 */
export function withStorybookProviders(providers: Array<Provider | EnvironmentProviders>): Decorator {
  return applicationConfig({ providers });
}

/**
 * Provides common Angular application wiring for Storybook previews.
 *
 * The helper intentionally keeps product-specific providers outside the shared
 * package while centralizing the framework defaults most Angular stories need.
 */
export function provideStorybookAngularApp(options: StorybookAngularAppProviderOptions = {}): EnvironmentProviders {
  const providers: Array<Provider | EnvironmentProviders> = [
    ...(options.includeHttpClient === false ? [] : [provideHttpClient()]),
    provideRouter(options.routes ?? [], ...(options.routerFeatures ?? [withDisabledInitialNavigation()])),
    ...(options.providers ?? []),
  ];

  return makeEnvironmentProviders(providers);
}

/**
 * Provides a Router test double that still satisfies Angular router bootstrap.
 *
 * Story-level Router mocks often only need to spy on `navigate` or
 * `navigateByUrl`, but the global Storybook preview can install router
 * initializers that call framework methods such as `initialNavigation`.
 */
export function provideStorybookRouter(overrides: Partial<Router> = {}): Provider {
  const router: StorybookRouterDouble = {
    events: EMPTY,
    initialNavigation: () => undefined,
    navigate: () => Promise.resolve(true),
    navigateByUrl: () => Promise.resolve(true),
    resetRootComponentType: () => undefined,
    setUpLocationChangeListener: () => undefined,
    ...overrides,
  };

  return {
    provide: Router,
    useValue: router,
  };
}

/**
 * Provides a Location test double that is safe for stories using Router setup.
 *
 * Angular's router subscribes to Location during initialization, so stories
 * that only spy on `back()` still need the rest of the Location surface to be
 * present enough for bootstrap.
 */
export function provideStorybookLocation(overrides: Partial<Location> = {}): Provider {
  const location: Partial<Location> = {
    back: () => undefined,
    forward: () => undefined,
    getState: () => null,
    go: () => undefined,
    historyGo: () => undefined,
    isCurrentPathEqualTo: () => false,
    normalize: (url: string) => url,
    onUrlChange: () => () => undefined,
    path: () => '',
    prepareExternalUrl: (url: string) => url,
    replaceState: () => undefined,
    subscribe: () => ({ closed: false, unsubscribe: () => undefined }),
    ...overrides,
  };

  return {
    provide: Location,
    useValue: location,
  };
}

/**
 * Provides deterministic PrimeNG theme configuration for Storybook.
 *
 * PrimeNG defaults `darkModeSelector` to system media queries. Storybook uses a
 * document-root class so toolbar-selected light, dark, and system modes can be
 * applied consistently across PrimeNG and Tailwind.
 */
export function provideStorybookPrimeNgTheme(options: StorybookPrimeNgThemeOptions): EnvironmentProviders {
  return providePrimeNG({
    ...(options.config ?? {}),
    theme: {
      preset: options.preset,
      options: {
        cssLayer: options.cssLayer ?? {
          name: 'primeng',
          order: 'theme, base, primeng',
        },
        darkModeSelector: options.darkModeSelector ?? `.${STORYBOOK_PRIMENG_DARK_CLASS}`,
        ...(options.options ?? {}),
      },
    },
  });
}

/**
 * Applies a Storybook toolbar-selected theme mode to the document root.
 *
 * The class is applied twice: once before rendering and once in a queued task,
 * which keeps Angular app initializers from overriding the selected mode during
 * story bootstrap.
 */
export function withStorybookPrimeNgThemeMode(options: StorybookThemeModeDecoratorOptions = {}): Decorator {
  const className = options.className ?? STORYBOOK_PRIMENG_DARK_CLASS;
  const defaultMode = options.defaultMode ?? 'dark';
  const globalName = options.globalName ?? STORYBOOK_THEME_MODE_GLOBAL;
  const fallbackSystemDarkMode = options.fallbackSystemDarkMode ?? false;

  return (story, context) => {
    const globals = (context.globals ?? {}) as Record<string, unknown>;
    const mode = readStorybookThemeMode(globals[globalName], defaultMode);
    const apply = () => {
      applyStorybookThemeMode(mode, className, fallbackSystemDarkMode);
    };

    apply();
    queueStorybookDocumentUpdate(apply);

    return story();
  };
}

/**
 * Marks the active viewport mode on the document root for viewport-aware stories.
 */
export function withStorybookViewportMode(options: StorybookViewportModeDecoratorOptions = {}): Decorator {
  const defaultMode = options.defaultMode ?? 'responsive';
  const globalName = options.globalName ?? STORYBOOK_VIEWPORT_MODE_GLOBAL;
  const widths = {
    ...storybookViewportWidths,
    ...(options.widths ?? {}),
  };

  return (story, context) => {
    const globals = (context.globals ?? {}) as Record<string, unknown>;
    const mode = readStorybookViewportMode(globals[globalName], defaultMode);
    const apply = () => {
      applyStorybookViewportMode(mode, widths[mode]);
    };

    apply();
    queueStorybookDocumentUpdate(apply);

    return story();
  };
}

function readStorybookThemeMode(value: unknown, fallback: StorybookThemeMode): StorybookThemeMode {
  return value === 'light' || value === 'dark' || value === 'system' ? value : fallback;
}

function readStorybookViewportMode(value: unknown, fallback: StorybookViewportMode): StorybookViewportMode {
  return value === 'responsive' || value === 'mobile' || value === 'tablet' || value === 'desktop' ? value : fallback;
}

function applyStorybookThemeMode(
  mode: StorybookThemeMode,
  className: string,
  fallbackSystemDarkMode: boolean,
): void {
  const root = getStorybookDocumentRoot();

  if (!root) {
    return;
  }

  const enabled = mode === 'system' ? readSystemDarkMode(fallbackSystemDarkMode) : mode === 'dark';
  root.classList.toggle(className, enabled);
  root.dataset['storybookThemeMode'] = mode;
  root.style.colorScheme = enabled ? 'dark' : 'light';
}

function applyStorybookViewportMode(mode: StorybookViewportMode, width: string | null): void {
  const root = getStorybookDocumentRoot();

  if (!root) {
    return;
  }

  root.dataset['storybookViewportMode'] = mode;

  if (width) {
    root.style.setProperty('--storybook-viewport-width', width);
  } else {
    root.style.removeProperty('--storybook-viewport-width');
  }
}

function getStorybookDocumentRoot(): HTMLElement | null {
  return typeof document === 'undefined' ? null : document.documentElement;
}

function readSystemDarkMode(fallback: boolean): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return fallback;
  }

  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return fallback;
  }
}

function queueStorybookDocumentUpdate(update: () => void): void {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(update);
    return;
  }

  if (typeof window !== 'undefined' && typeof window.setTimeout === 'function') {
    window.setTimeout(update, 0);
  }
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
