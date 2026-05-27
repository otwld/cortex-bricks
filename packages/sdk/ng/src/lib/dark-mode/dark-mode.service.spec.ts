import { DOCUMENT } from '@angular/common';
import { createEnvironmentInjector, EnvironmentInjector, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { provideDarkMode } from './dark-mode.provider';
import { DarkModeService } from './dark-mode.service';

type MatchMediaListener = (event: MediaQueryListEvent) => void;

describe('DarkModeService', () => {
  const storage = new Map<string, string>();
  let matches = false;
  let listeners: MatchMediaListener[];
  let localStorageMock: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  let addEventListenerMock: ReturnType<typeof vi.fn>;
  let removeEventListenerMock: ReturnType<typeof vi.fn>;
  let addListenerMock: ReturnType<typeof vi.fn>;
  let removeListenerMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    TestBed.resetTestingModule();
    storage.clear();
    matches = false;
    listeners = [];
    document.documentElement.className = '';
    Object.defineProperty(document, 'startViewTransition', {
      configurable: true,
      value: undefined,
    });

    localStorageMock = {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage.set(key, value);
      }),
      removeItem: vi.fn((key: string) => {
        storage.delete(key);
      }),
    };

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: localStorageMock,
    });

    addEventListenerMock = vi.fn((_type: string, listener: MatchMediaListener) => {
      listeners.push(listener);
    });
    removeEventListenerMock = vi.fn((_type: string, listener: MatchMediaListener) => {
      listeners = listeners.filter((existingListener) => existingListener !== listener);
    });
    addListenerMock = vi.fn((listener: MatchMediaListener) => {
      listeners.push(listener);
    });
    removeListenerMock = vi.fn((listener: MatchMediaListener) => {
      listeners = listeners.filter((existingListener) => existingListener !== listener);
    });

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({
        matches,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
        addListener: addListenerMock,
        removeListener: removeListenerMock,
        dispatchEvent: vi.fn(),
      })),
    });
  });

  function createService(config: Parameters<typeof provideDarkMode>[0] = {}): DarkModeService {
    TestBed.configureTestingModule({
      providers: [
        provideDarkMode(config),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    return TestBed.inject(DarkModeService);
  }

  function emitSystemPreferenceChange(nextMatches: boolean): void {
    matches = nextMatches;
    const event = { matches: nextMatches } as MediaQueryListEvent;
    listeners.forEach((listener) => listener(event));
  }

  it('resolves system dark as true and applies app-dark', () => {
    matches = true;

    const service = createService();

    expect(service.preference()).toBe('system');
    expect(service.isDarkMode()).toBe(true);
    expect(document.documentElement.classList.contains('app-dark')).toBe(true);
  });

  it('resolves system light as false and removes app-dark', () => {
    document.documentElement.classList.add('app-dark');

    const service = createService();

    expect(service.isDarkMode()).toBe(false);
    expect(document.documentElement.classList.contains('app-dark')).toBe(false);
  });

  it('uses explicit dark over system light and persists dark', () => {
    const service = createService();

    service.setPreference('dark');

    expect(service.preference()).toBe('dark');
    expect(service.isDarkMode()).toBe(true);
    expect(storage.get('otwld.dark-mode.preference')).toBe('dark');
    expect(document.documentElement.classList.contains('app-dark')).toBe(true);
  });

  it('uses persisted light over system dark', () => {
    matches = true;
    storage.set('otwld.dark-mode.preference', 'light');

    const service = createService();

    expect(service.preference()).toBe('light');
    expect(service.isDarkMode()).toBe(false);
    expect(document.documentElement.classList.contains('app-dark')).toBe(false);
  });

  it('falls back to configured preference for invalid persisted values', () => {
    storage.set('otwld.dark-mode.preference', 'invalid');

    const service = createService({ initialPreference: 'dark' });

    expect(service.preference()).toBe('dark');
    expect(service.isDarkMode()).toBe(true);
  });

  it('updates isDarkMode when the system preference changes while using system', () => {
    const service = createService();

    expect(service.isDarkMode()).toBe(false);

    emitSystemPreferenceChange(true);

    expect(service.preference()).toBe('system');
    expect(service.isDarkMode()).toBe(true);
    expect(document.documentElement.classList.contains('app-dark')).toBe(true);
  });

  it('uses the dark fallback when matchMedia is unavailable', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: undefined,
    });

    const service = createService({ initialPreference: 'system', fallbackDarkMode: true });

    expect(service.preference()).toBe('system');
    expect(service.isDarkMode()).toBe(true);
    expect(document.documentElement.classList.contains('app-dark')).toBe(true);
  });

  it('uses the light fallback when matchMedia is unavailable', () => {
    document.documentElement.classList.add('app-dark');
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: undefined,
    });

    const service = createService({ initialPreference: 'system', fallbackDarkMode: false });

    expect(service.preference()).toBe('system');
    expect(service.isDarkMode()).toBe(false);
    expect(document.documentElement.classList.contains('app-dark')).toBe(false);
  });

  it('toggleDarkMode persists the opposite explicit preference', () => {
    matches = true;
    const service = createService();

    service.toggleDarkMode();

    expect(service.preference()).toBe('light');
    expect(service.isDarkMode()).toBe(false);
    expect(storage.get('otwld.dark-mode.preference')).toBe('light');
  });

  it('does not use view transitions for initial class application', () => {
    matches = true;
    const startViewTransition = vi.fn((callback: () => void) => {
      callback();
    });
    Object.defineProperty(document, 'startViewTransition', {
      configurable: true,
      value: startViewTransition,
    });

    const service = createService();

    expect(service.isDarkMode()).toBe(true);
    expect(document.documentElement.classList.contains('app-dark')).toBe(true);
    expect(startViewTransition).not.toHaveBeenCalled();
  });

  it('uses view transitions for subsequent dark-mode changes when enabled', () => {
    const startViewTransition = vi.fn((callback: () => void) => {
      callback();
    });
    Object.defineProperty(document, 'startViewTransition', {
      configurable: true,
      value: startViewTransition,
    });
    const service = createService();

    service.setPreference('dark');

    expect(startViewTransition).toHaveBeenCalledOnce();
    expect(document.documentElement.classList.contains('app-dark')).toBe(true);
  });

  it('applies subsequent dark-mode changes synchronously when view transitions are disabled', () => {
    const startViewTransition = vi.fn((callback: () => void) => {
      callback();
    });
    Object.defineProperty(document, 'startViewTransition', {
      configurable: true,
      value: startViewTransition,
    });
    const service = createService({ viewTransitions: false });

    service.setPreference('dark');

    expect(startViewTransition).not.toHaveBeenCalled();
    expect(document.documentElement.classList.contains('app-dark')).toBe(true);
  });

  it('exposes preference as readonly', () => {
    const service = createService();

    expect('set' in service.preference).toBe(false);
    expect('update' in service.preference).toBe(false);
  });

  it('removes the system preference listener on destroy', () => {
    const service = createService();
    const registeredListener = addEventListenerMock.mock.calls[0][1] as MatchMediaListener;

    TestBed.resetTestingModule();
    emitSystemPreferenceChange(true);

    expect(removeEventListenerMock).toHaveBeenCalledWith('change', registeredListener);
    expect(service.isDarkMode()).toBe(false);
  });

  it('does not throw when localStorage is unavailable', () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => {
        throw new Error('Storage unavailable');
      },
    });

    const service = createService({ initialPreference: 'light' });

    expect(service.preference()).toBe('light');
    expect(() => service.setPreference('dark')).not.toThrow();
  });

  it('does not throw when DOCUMENT is unavailable', () => {
    const injector = createEnvironmentInjector(
      [
        provideDarkMode(),
        DarkModeService,
        { provide: DOCUMENT, useValue: null },
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
      TestBed.inject(EnvironmentInjector),
    );

    expect(() => injector.get(DarkModeService)).not.toThrow();

    injector.destroy();
  });

  it('auto-syncs the root class when configured', async () => {
    matches = true;
    TestBed.configureTestingModule({
      providers: [
        provideDarkMode({ autoSync: true }),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    await TestBed.inject(EnvironmentInjector).runInContext(async () => undefined);

    expect(document.documentElement.classList.contains('app-dark')).toBe(true);
  });
});
