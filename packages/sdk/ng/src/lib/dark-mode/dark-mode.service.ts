import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { computed, DestroyRef, inject, Injectable, PLATFORM_ID, Signal, signal } from '@angular/core';
import { DARK_MODE_CONFIG } from './dark-mode.token';
import { DarkModePreference } from './dark-mode.types';

type MediaQueryChangeListener = (event: MediaQueryListEvent) => void;

/**
 * Provides dark mode service behavior.
 */
@Injectable({ providedIn: 'root' })
export class DarkModeService {
  private readonly config = inject(DARK_MODE_CONFIG);
  private readonly document = inject(DOCUMENT, { optional: true });
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly systemDarkMode = signal(this.readSystemDarkMode());
  private readonly preferenceState = signal<DarkModePreference>(this.readInitialPreference());
  private initialized = false;

  readonly preference: Signal<DarkModePreference> = this.preferenceState.asReadonly();
  readonly isDarkMode = computed(() => {
    const preference = this.preferenceState();

    if (preference === 'dark') {
      return true;
    }

    if (preference === 'light') {
      return false;
    }

    return this.systemDarkMode();
  });

  constructor() {
    this.listenForSystemPreferenceChanges();
    this.applyDarkModeClass();
  }

  /**
   * Runs set preference.
   *
   * @param preference - preference value.
   */
  setPreference(preference: DarkModePreference): void {
    this.preferenceState.set(preference);
    this.persistPreference(preference);
    this.applyDarkModeClass();
  }

  /**
   * Runs set dark mode.
   *
   * @param enabled - enabled value.
   */
  setDarkMode(enabled: boolean): void {
    this.setPreference(enabled ? 'dark' : 'light');
  }

  /**
   * Runs use system preference.
   */
  useSystemPreference(): void {
    this.setPreference('system');
  }

  /**
   * Runs toggle dark mode.
   */
  toggleDarkMode(): void {
    this.setDarkMode(!this.isDarkMode());
  }

  private readInitialPreference(): DarkModePreference {
    const persistedPreference = this.readPersistedPreference();

    if (persistedPreference) {
      return persistedPreference;
    }

    return this.config.initialPreference;
  }

  private readPersistedPreference(): DarkModePreference | null {
    if (!this.canUseStorage()) {
      return null;
    }

    try {
      const value = window.localStorage.getItem(this.config.storageKey);
      return this.isDarkModePreference(value) ? value : null;
    } catch {
      return null;
    }
  }

  private persistPreference(preference: DarkModePreference): void {
    if (!this.canUseStorage()) {
      return;
    }

    try {
      window.localStorage.setItem(this.config.storageKey, preference);
    } catch {
      return;
    }
  }

  private canUseStorage(): boolean {
    return this.isBrowser && this.config.persistence && typeof window !== 'undefined';
  }

  private readSystemDarkMode(): boolean {
    const mediaQuery = this.getDarkModeMediaQuery();
    return mediaQuery?.matches ?? this.config.fallbackDarkMode;
  }

  private listenForSystemPreferenceChanges(): void {
    const mediaQuery = this.getDarkModeMediaQuery();

    if (!mediaQuery) {
      return;
    }

    const listener: MediaQueryChangeListener = (event) => {
      this.systemDarkMode.set(event.matches);

      if (this.preferenceState() === 'system') {
        this.applyDarkModeClass();
      }
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', listener);
      this.destroyRef.onDestroy(() => {
        mediaQuery.removeEventListener('change', listener);
      });
      return;
    }

    if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(listener);
      this.destroyRef.onDestroy(() => {
        mediaQuery.removeListener(listener);
      });
    }
  }

  private getDarkModeMediaQuery(): MediaQueryList | null {
    if (!this.isBrowser || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return null;
    }

    try {
      return window.matchMedia('(prefers-color-scheme: dark)');
    } catch {
      return null;
    }
  }

  private applyDarkModeClass(): void {
    const documentElement = this.document?.documentElement;

    if (!documentElement) {
      return;
    }

    const updateClass = () => {
      documentElement.classList.toggle(this.config.className, this.isDarkMode());
    };
    const startViewTransition = this.document?.startViewTransition?.bind(this.document);

    if (this.config.viewTransitions && this.initialized && typeof startViewTransition === 'function') {
      startViewTransition(updateClass);
    } else {
      updateClass();
    }

    this.initialized = true;
  }

  private isDarkModePreference(value: string | null): value is DarkModePreference {
    return value === 'light' || value === 'dark' || value === 'system';
  }
}
