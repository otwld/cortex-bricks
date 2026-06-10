import { isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  Directive,
  ElementRef,
  PLATFORM_ID,
  Renderer2,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';

/**
 * Options used internally to configure the IntersectionObserver.
 * @internal
 */
interface ObserverSetup {
  /** Sticky offset in pixels resolved for the current host. */
  top: number;
  /** Scroll root element; `null` for viewport. */
  root: HTMLElement | null;
}

/**
 * Directive that applies a CSS class (default: `"stuck"`) to the host element
 * when a `position: sticky` element is pinned. Works with viewport
 * or a custom scroll container and supports automatic discovery of the CSS `top`
 * offset from computed styles (media queries, CSS variables, etc.).
 *
 * @remarks
 * - Efficient: leverages `IntersectionObserver` (no scroll listeners).
 * - SSR-safe: becomes a no-op when not in a browser context.
 * - Automatic offset detection reads the computed style (`top` or logical
 *   properties) and re-measures on resize and class/style mutations.
 *
 * @example Basic (viewport sticky)
 * ```html
 * <header kitStickyClass class="sticky top-16 z-50">...</header>
 * ```
 *
 * @example Force the sticky offset and custom class
 * ```html
 * <header kitStickyClass [stickyTop]="64" [stickyStuckClass]="'is-stuck'" class="sticky top-16">
 *   ...
 * </header>
 * ```
 *
 * @example Inside a scroll container
 * ```html
 * <div #scroller class="h-[600px] overflow-auto">
 *   <div kitStickyClass [stickyRoot]="scroller" class="sticky top-3">Filters…</div>
 * </div>
 * ```
 */
@Directive({
  selector: '[kitStickyClass]',
  standalone: true,
  host: {
    '[style.top.px]': `stickyTop()`,
  },
})
/** Toggles CSS classes when the host crosses sticky sentinel boundaries. */
export class StickyClassDirective {
  /** Host element reference. */
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Renderer for DOM-safe mutations. */
  private readonly renderer = inject(Renderer2);

  /** Destroy hook to guarantee observer cleanup. */
  private readonly destroyRef = inject(DestroyRef);

  /** Platform token to guard browser-only APIs. */
  private readonly platformId = inject(PLATFORM_ID);

  /**
   * Overrides the sticky offset in pixels. When omitted (`null`/`undefined`),
   * the directive will auto-detect the value from the host’s computed styles.
   *
   * @defaultValue `null` (auto-detect)
   */
  readonly stickyTop = input<number | null>(null);

  /**
   * CSS class applied when the element is considered “stuck”.
   *
   * @defaultValue `'stuck'`
   */
  readonly stickyStuckClass = input<string>('stuck');

  /**
   * Optional scroll root (e.g., a scrollable container).
   * Provide `null` (default) to use the viewport.
   *
   * @defaultValue `null`
   */
  readonly stickyRoot = input<HTMLElement | null>(null);

  /**
   * Reactive, read-only signal indicating whether the element is currently stuck.
   * Consumers may read this to react in templates or other effects.
   *
   * @example
   * ```ts
   * // Template: [class.shadow]="dir.stuck()"
   * ```
   */
  readonly stuck = signal<boolean>(false);

  /**
   * Measured top offset in pixels used when {@link stickyTop} is not provided.
   * Kept as state to trigger re-initialization of the observer when it changes.
   * @internal
   */
  private readonly measuredTop = signal<number>(0);

  /** Current IntersectionObserver instance (browser-only). */
  private io: IntersectionObserver | null = null;

  /** Invisible sentinel placed just before the host to detect pinning. */
  private sentinel: HTMLSpanElement | null = null;

  /** Re-measurement observers (browser-only). */
  private resizeObs: ResizeObserver | null = null;
  private mutObs: MutationObserver | null = null;

  constructor() {
    // Apply/remove the “stuck” class reactively.
    effect(() => {
      const cls = this.stickyStuckClass();
      const isStuck = this.stuck();
      const host = this.hostRef.nativeElement;
      if (cls) {
        (() => (isStuck ? this.renderer.addClass(host, cls) : this.renderer.removeClass(host, cls)))();
      }
    });

    // Auto-detect top when no explicit stickyTop is provided.
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      const explicitTop = this.stickyTop();
      if (explicitTop == null) this.measureTopFromComputedStyle();
    });

    // Recreate the IntersectionObserver when root or effective top changes.
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;

      const root = this.stickyRoot();
      const explicitTop = this.stickyTop();
      const top = explicitTop ?? this.measuredTop();

      this.teardownObserver();
      this.setupObserver({ top, root });

      this.destroyRef.onDestroy(() => this.teardownObserver());
    });

    // Install observers for automatic re-measurement (resize, class/style changes).
    if (isPlatformBrowser(this.platformId)) {
      this.initAutoMeasureObservers();
      this.destroyRef.onDestroy(() => this.teardownAutoMeasureObservers());
    }
  }

  /**
   * Measures the sticky `top` offset from the host’s computed style.
   * Falls back to logical properties (`inset-block-start` / `inset-inline-start`)
   * when `top` resolves to `auto`.
   *
   * @remarks
   * Values from computed style are already resolved to pixels; rounding is applied
   * to stabilize observer thresholds.
   */
  private measureTopFromComputedStyle(): void {
    const el = this.hostRef.nativeElement;
    const cs = getComputedStyle(el);

    // 1) Try `top`
    let topStr = cs.top;

    // 2) Fallback to logical properties for writing modes/RTL
    if (!topStr || topStr === 'auto') {
      const logical = cs.getPropertyValue('inset-block-start') || cs.getPropertyValue('inset-inline-start');
      if (logical && logical !== 'auto') {
        topStr = logical.trim();
      }
    }

    // 3) Parse to px; computedStyle already resolves vars/units
    const parsed = parseFloat(topStr);
    const px = Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;

    if (this.measuredTop() !== px) this.measuredTop.set(px);
  }

  /**
   * Installs observers that trigger re-measurement of the sticky offset when layout
   * or styles change (e.g., media queries, class toggles, inline styles, window resize).
   *
   * @internal
   */
  private initAutoMeasureObservers(): void {
    const el = this.hostRef.nativeElement;

    this.resizeObs = new ResizeObserver(() => this.measureTopFromComputedStyle());
    this.resizeObs.observe(el);
    this.resizeObs.observe(document.documentElement);

    this.mutObs = new MutationObserver(() => this.measureTopFromComputedStyle());
    this.mutObs.observe(el, { attributes: true, attributeFilter: ['class', 'style'] });

    window.addEventListener('resize', this.windowResizeRecalc, { passive: true });
  }

  /** Window resize callback that re-measures the sticky offset. */
  private windowResizeRecalc = () => this.measureTopFromComputedStyle();

  /**
   * Tears down the measurement observers installed by {@link initAutoMeasureObservers}.
   * Always called on directive destroy.
   *
   * @internal
   */
  private teardownAutoMeasureObservers(): void {
    if (this.resizeObs) {
      this.resizeObs.disconnect();
      this.resizeObs = null;
    }
    if (this.mutObs) {
      this.mutObs.disconnect();
      this.mutObs = null;
    }
    window.removeEventListener('resize', this.windowResizeRecalc);
  }

  /**
   * Creates the invisible sentinel and IntersectionObserver that determines the
   * “stuck” state. When the sentinel is no longer intersecting the root at the
   * pin line (`-top` rootMargin), the host is considered stuck.
   *
   * @param config - Effective top and root to use for the observer.
   */
  private setupObserver(config: ObserverSetup): void {
    const { top, root } = config;
    const host = this.hostRef.nativeElement;

    // Create sentinel just before the host (same offset context).
    const sentinel = this.renderer.createElement('span') as HTMLSpanElement;
    this.sentinel = sentinel;
    this.renderer.setStyle(sentinel, 'position', 'relative');
    this.renderer.setStyle(sentinel, 'display', 'block');
    this.renderer.setStyle(sentinel, 'width', '0');
    this.renderer.setStyle(sentinel, 'height', '0');
    this.renderer.setStyle(sentinel, 'margin', '0');
    this.renderer.setStyle(sentinel, 'padding', '0');
    this.renderer.setStyle(sentinel, 'opacity', '0');
    this.renderer.insertBefore(host.parentNode, sentinel, host);

    // Negative top root margin trips exactly at the sticky pin line.
    const rootMarginTop = `-${Math.max(0, Math.round(top))}px`;
    const options: IntersectionObserverInit = {
      root: root ?? null,
      rootMargin: `${rootMarginTop} 0px 0px 0px`,
      threshold: [0, 1],
    };

    this.io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      const isIntersecting = entry?.isIntersecting ?? true;
      this.stuck.set(!isIntersecting);
    }, options);

    this.io.observe(sentinel);
  }

  /**
   * Disposes the active IntersectionObserver and removes the sentinel from the DOM.
   * Resets the `stuck` state to `false` to avoid stale class application across
   * reconfigurations (e.g., when inputs change).
   */
  private teardownObserver(): void {
    if (this.io && this.sentinel) this.io.unobserve(this.sentinel);
    if (this.io) {
      this.io.disconnect();
      this.io = null;
    }
    if (this.sentinel?.parentNode) {
      this.renderer.removeChild(this.sentinel.parentNode, this.sentinel);
    }
    this.sentinel = null;
    this.stuck.set(false);
  }
}
