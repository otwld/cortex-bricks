export interface Shortcut {
  readonly key: string;
  readonly icon?: string;
  readonly wordI18n?: string;
  readonly callback: () => void;
  readonly labelI18n: string;
  /**
   * If `initialDelay` or `repeatInterval` are provided, the key will enable continuous pressing behavior.
   * The delay in milliseconds before the *first* repeat of the callback occurs (default: 500ms for repeating keys).
   * If neither is provided, the callback will only fire once on `keyup`.
   */
  readonly initialDelay?: number;
  /**
   * If `initialDelay` or `repeatInterval` are provided, the key will enable continuous pressing behavior.
   * The interval in milliseconds at which subsequent repeats of the callback occur (default: 1000ms for repeating keys).
   * If neither is provided, the callback will only fire once on `keyup`.
   */
  readonly repeatInterval?: number;
}
