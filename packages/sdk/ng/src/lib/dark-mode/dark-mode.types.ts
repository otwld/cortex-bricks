/**
 * Represents dark mode preference.
 */
export type DarkModePreference = 'light' | 'dark' | 'system';

/**
 * Describes dark mode config values.
 */
export interface DarkModeConfig {
  readonly className?: string;
  readonly storageKey?: string;
  readonly initialPreference?: DarkModePreference;
  readonly persistence?: boolean;
  readonly viewTransitions?: boolean;
  readonly fallbackDarkMode?: boolean;
  readonly autoSync?: boolean;
}
