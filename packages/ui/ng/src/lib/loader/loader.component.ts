import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Layout mode used by `LoaderComponent`.
 */
export type LoaderMode = 'inline' | 'block' | 'overlay' | 'fullscreen' | 'button';

/**
 * Spinner size used by `LoaderComponent`.
 */
export type LoaderSize = 'sm' | 'md' | 'lg';

/**
 * Position of optional loader text relative to the spinner.
 */
export type LoaderTextPosition = 'right' | 'bottom';

/**
 * Accessible loading indicator for inline, block, overlay, fullscreen, and
 * button contexts.
 */
@Component({
  selector: 'kit-loader',
  standalone: true,
  template: `
    @if (hasBackdrop()) {
      <span class="kit-loader__backdrop" aria-hidden="true"></span>
    }
    <span class="kit-loader__content">
      <span class="kit-loader__spinner" aria-hidden="true"></span>
      @if (text()) {
        <span class="kit-loader__text">{{ text() }}</span>
      }
    </span>
  `,
  styles: [
    `
      :host {
        --kit-loader-size: 1.5rem;
        --kit-loader-backdrop-opacity: 0.4;
        align-items: center;
        justify-content: center;
        color: currentColor;
      }

      :host(.kit-loader--inline),
      :host(.kit-loader--button) {
        display: inline-flex;
      }

      :host(.kit-loader--block) {
        display: flex;
        width: 100%;
        padding: 1rem;
      }

      :host(.kit-loader--overlay),
      :host(.kit-loader--fullscreen) {
        display: flex;
        inset: 0;
        z-index: 20;
      }

      :host(.kit-loader--overlay) {
        position: absolute;
      }

      :host(.kit-loader--fullscreen) {
        position: fixed;
      }

      :host(.kit-loader--size-sm) {
        --kit-loader-size: 1rem;
      }

      :host(.kit-loader--size-lg) {
        --kit-loader-size: 2.25rem;
      }

      .kit-loader__backdrop {
        position: absolute;
        inset: 0;
        background: rgba(15, 23, 42, var(--kit-loader-backdrop-opacity));
      }

      :host(.kit-loader--transparent) .kit-loader__backdrop {
        background: transparent;
      }

      .kit-loader__content {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }

      :host(.kit-loader--text-bottom) .kit-loader__content {
        flex-direction: column;
      }

      .kit-loader__spinner {
        width: var(--kit-loader-size);
        height: var(--kit-loader-size);
        border: 2px solid currentColor;
        border-top-color: transparent;
        border-radius: 50%;
        animation: kit-loader-spin 0.75s linear infinite;
      }

      .kit-loader__text {
        font-size: 0.875rem;
        line-height: 1.3;
      }

      @keyframes kit-loader-spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'status',
    '[class]': 'hostClass()',
    '[attr.aria-busy]': 'true',
    '[attr.aria-label]': 'ariaLabelResolved()',
    '[style.--kit-loader-backdrop-opacity]': 'backdropOpacity()',
  },
})
export class LoaderComponent {
  /** Loader layout mode. */
  readonly mode = input<LoaderMode>('inline');

  /** Optional visible loading text. */
  readonly text = input<string | null>(null);

  /** Spinner size. */
  readonly size = input<LoaderSize>('md');

  /** Position of optional visible loading text. */
  readonly textPosition = input<LoaderTextPosition>('bottom');

  /** Whether overlay and fullscreen modes render a backdrop. */
  readonly showBackdrop = input(true);

  /** Whether the backdrop should be transparent. */
  readonly transparent = input(false);

  /** Backdrop opacity for overlay and fullscreen modes. */
  readonly backdropOpacity = input(0.4);

  /** Optional accessible label; falls back to visible text or "Loading". */
  readonly ariaLabel = input<string | null>(null);

  protected readonly hostClass = computed(() =>
    [
      'kit-loader',
      `kit-loader--${this.mode()}`,
      `kit-loader--size-${this.size()}`,
      `kit-loader--text-${this.textPosition()}`,
      this.transparent() ? 'kit-loader--transparent' : '',
    ]
      .filter(Boolean)
      .join(' '),
  );

  protected hasBackdrop(): boolean {
    const mode = this.mode();

    return this.showBackdrop() && (mode === 'overlay' || mode === 'fullscreen');
  }

  protected ariaLabelResolved(): string {
    return this.ariaLabel() ?? this.text() ?? 'Loading';
  }
}
