import { Location } from '@angular/common';
import { Router } from '@angular/router';
import {
  createStorybookChartArgTypes,
  provideStorybookAngularApp,
  provideStorybookLocation,
  provideStorybookPrimeNgTheme,
  provideStorybookRouter,
  storybookPrimeNgThemeGlobalTypes,
  storybookViewportGlobalTypes,
  withStorybookPrimeNgThemeMode,
  withStorybookViewportMode,
} from './storybook';

describe('createStorybookChartArgTypes', () => {
  it('creates common input controls and data-selection actions', () => {
    expect(
      createStorybookChartArgTypes({
        dataInput: {
          name: 'series',
          description: 'Series rendered by the chart.',
        },
        dataOutput: {
          name: 'dataSelected',
        },
      }),
    ).toEqual(
      expect.objectContaining({
        chartClass: expect.objectContaining({
          control: 'text',
          table: { category: 'Inputs' },
        }),
        colorScheme: expect.objectContaining({
          control: 'radio',
          options: ['light', 'dark'],
        }),
        dataSelected: expect.objectContaining({
          action: 'dataSelected',
          table: { category: 'Outputs' },
        }),
        labels: expect.objectContaining({
          control: 'object',
        }),
        series: expect.objectContaining({
          control: 'object',
          description: 'Series rendered by the chart.',
        }),
      }),
    );
  });

  it('can omit axis labels for non-axis chart stories', () => {
    expect(
      createStorybookChartArgTypes({
        dataInput: {
          name: 'categories',
          description: 'Candidate source categories rendered by the chart.',
        },
        includeLabels: false,
      }),
    ).not.toHaveProperty('labels');
  });
});

describe('provideStorybookRouter', () => {
  it('keeps router bootstrap methods available while allowing story overrides', async () => {
    const navigate = vi.fn(() => Promise.resolve(true));
    const provider = provideStorybookRouter({ navigate });
    const valueProvider = provider as unknown as {
      provide: typeof Router;
      useValue: Partial<Router> & {
        resetRootComponentType?: () => void;
        setUpLocationChangeListener?: () => void;
      };
    };
    const router = valueProvider.useValue;

    expect(valueProvider.provide).toBe(Router);
    expect(router.initialNavigation).toEqual(expect.any(Function));
    expect(router.resetRootComponentType).toEqual(expect.any(Function));
    expect(router.setUpLocationChangeListener).toEqual(expect.any(Function));
    expect(router.events).toBeDefined();

    await expect(router.navigate?.(['/dashboard'])).resolves.toBe(true);
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});

describe('provideStorybookLocation', () => {
  it('keeps location subscription methods available while allowing story overrides', () => {
    const back = vi.fn();
    const provider = provideStorybookLocation({ back });
    const valueProvider = provider as unknown as { provide: typeof Location; useValue: Partial<Location> };
    const location = valueProvider.useValue;

    expect(valueProvider.provide).toBe(Location);
    expect(location.subscribe?.(() => undefined)).toEqual(
      expect.objectContaining({
        unsubscribe: expect.any(Function),
      }),
    );
    expect(location.path?.()).toBe('');

    location.back?.();
    expect(back).toHaveBeenCalledTimes(1);
  });
});

describe('provideStorybookAngularApp', () => {
  it('creates common application providers for Storybook previews', () => {
    expect(provideStorybookAngularApp()).toBeDefined();
  });
});

describe('provideStorybookPrimeNgTheme', () => {
  it('creates deterministic PrimeNG theme providers for Storybook previews', () => {
    expect(provideStorybookPrimeNgTheme({ preset: { semantic: {} } })).toBeDefined();
  });
});

describe('storybook global types', () => {
  it('exposes theme and viewport toolbar globals', () => {
    expect(storybookPrimeNgThemeGlobalTypes.themeMode.defaultValue).toBe('dark');
    expect(storybookViewportGlobalTypes.viewportMode.defaultValue).toBe('responsive');
  });
});

describe('withStorybookPrimeNgThemeMode', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('applies dark mode through the configured document root class', () => {
    const classList = { toggle: vi.fn() };
    const documentElement = {
      classList,
      dataset: {},
      style: { colorScheme: '' },
    };
    const story = vi.fn(() => ({}));

    vi.stubGlobal('document', { documentElement });
    vi.stubGlobal('queueMicrotask', (update: () => void) => update());

    withStorybookPrimeNgThemeMode()(story, {
      globals: { themeMode: 'dark' },
    } as never);

    expect(classList.toggle).toHaveBeenCalledWith('app-dark', true);
    expect(documentElement.dataset).toEqual({ storybookThemeMode: 'dark' });
    expect(documentElement.style.colorScheme).toBe('dark');
    expect(story).toHaveBeenCalledTimes(1);
  });

  it('resolves system mode from the browser media query', () => {
    const classList = { toggle: vi.fn() };
    const documentElement = {
      classList,
      dataset: {},
      style: { colorScheme: '' },
    };

    vi.stubGlobal('document', { documentElement });
    vi.stubGlobal('window', {
      matchMedia: vi.fn(() => ({ matches: true })),
    });
    vi.stubGlobal('queueMicrotask', (update: () => void) => update());

    withStorybookPrimeNgThemeMode()(() => ({}), {
      globals: { themeMode: 'system' },
    } as never);

    expect(classList.toggle).toHaveBeenCalledWith('app-dark', true);
    expect(documentElement.dataset).toEqual({ storybookThemeMode: 'system' });
  });
});

describe('withStorybookViewportMode', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('marks the active viewport mode on the document root', () => {
    const style = {
      removeProperty: vi.fn(),
      setProperty: vi.fn(),
    };
    const documentElement = {
      dataset: {},
      style,
    };

    vi.stubGlobal('document', { documentElement });
    vi.stubGlobal('queueMicrotask', (update: () => void) => update());

    withStorybookViewportMode()(() => ({}), {
      globals: { viewportMode: 'mobile' },
    } as never);

    expect(documentElement.dataset).toEqual({ storybookViewportMode: 'mobile' });
    expect(style.setProperty).toHaveBeenCalledWith('--storybook-viewport-width', '390px');
  });
});
