import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  model,
  untracked,
  viewChild,
} from '@angular/core';
import { Subscription, fromEvent } from 'rxjs';
import { filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'kit-zoom-pan',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './zoom-pan.component.html',
  styleUrl: './zoom-pan.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/** Provides pan and zoom interactions for arbitrary projected content. */
export class ZoomPanComponent implements OnDestroy {
  private readonly wrapperRef = viewChild.required<ElementRef<HTMLElement>>('wrapper');
  private readonly contentRef = viewChild.required<ElementRef<HTMLElement>>('content');

  private subs = new Subscription();

  public readonly zoom = model<number>(1);
  public readonly maxZoom = input<number>(5);
  public readonly minZoom = input<number>(1);
  public readonly panX = model<number>(0);
  public readonly panY = model<number>(0);

  constructor() {
    effect(() => {
      const wrapper = this.wrapperRef().nativeElement;
      const content = this.contentRef().nativeElement;

      content.style.transformOrigin = '0 0';
      content.style.touchAction = 'none';
      wrapper.style.cursor = 'grab';

      untracked(() => {
        this.attachWheelZoom(wrapper);
        this.attachMousePan(wrapper);
        this.attachDoubleClickReset(wrapper, content);
        this.attachTouchPan(wrapper);
        this.attachPinchZoom(wrapper);
      });
    });

    effect(() => {
      this.updateTransform(this.contentRef().nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  /**
   * Applies the current pan/zoom transform and optionally clamps the pan values.
   */
  private updateTransform(contentEl: HTMLElement, clamp = false) {
    if (clamp) {
      const wrapper = this.wrapperRef().nativeElement;
      this.clampPan(wrapper, contentEl);
    }
    contentEl.style.transform = `translate(${this.panX()}px, ${this.panY()}px) scale(${this.zoom()})`;
  }

  /**
   * Clamps pan values to keep the projected content within wrapper bounds.
   */
  private clampPan(wrapper: HTMLElement, content: HTMLElement) {
    const wrapperRect = wrapper.getBoundingClientRect();
    const contentWidth = content.offsetWidth * this.zoom();
    const contentHeight = content.offsetHeight * this.zoom();

    const minX = Math.min(0, wrapperRect.width - contentWidth);
    const maxX = 0;

    const minY = Math.min(0, wrapperRect.height - contentHeight);
    const maxY = 0;

    this.panX.set(Math.min(Math.max(this.panX(), minX), maxX));
    this.panY.set(Math.min(Math.max(this.panY(), minY), maxY));
  }

  /**
   * Adjusts the pan values to keep the zoom centered around a specific point or the wrapper's center.
   * @param oldScale The zoom level before the scale change.
   * @param newScale The zoom level after the scale change.
   * @param pivotX The X-coordinate of the zoom pivot (e.g., mouse X, center of wrapper).
   * @param pivotY The Y-coordinate of the zoom pivot (e.g., mouse Y, center of wrapper).
   */
  private adjustPanForZoom(oldScale: number, newScale: number, pivotX: number, pivotY: number): void {
    const imageX = (pivotX - this.panX()) / oldScale;
    const imageY = (pivotY - this.panY()) / oldScale;

    this.panX.set(pivotX - imageX * newScale);
    this.panY.set(pivotY - imageY * newScale);
  }

  /**
   * Increases zoom by the provided step and keeps the content centered.
   */
  public zoomIn(step = 0.15): void {
    const oldScale = this.zoom();
    const newScale = Math.min(this.maxZoom(), oldScale + step);

    if (newScale !== oldScale) {
      const wrapper = this.wrapperRef().nativeElement;
      const wrapperRect = wrapper.getBoundingClientRect();
      const centerX = wrapperRect.width / 2;
      const centerY = wrapperRect.height / 2;

      this.adjustPanForZoom(oldScale, newScale, centerX, centerY);
      this.zoom.set(newScale);
      this.updateTransform(this.contentRef().nativeElement, true);
    }
  }

  /**
   * Decreases zoom by the provided step and keeps the content centered.
   */
  public zoomOut(step = 0.15): void {
    const oldScale = this.zoom();
    const newScale = Math.min(this.maxZoom(), Math.max(this.minZoom(), oldScale - step));

    if (newScale !== oldScale) {
      const wrapper = this.wrapperRef().nativeElement;
      const wrapperRect = wrapper.getBoundingClientRect();
      const centerX = wrapperRect.width / 2;
      const centerY = wrapperRect.height / 2;

      this.adjustPanForZoom(oldScale, newScale, centerX, centerY);
      this.zoom.set(newScale);
      this.updateTransform(this.contentRef().nativeElement, true);
    }
  }

  /**
   * Attaches one-finger touch panning behavior to the wrapper.
   */
  private attachTouchPan(wrapperEl: HTMLElement) {
    const touchstart$ = fromEvent<TouchEvent>(wrapperEl, 'touchstart', { passive: true }).pipe(
      filter((e) => e.touches.length === 1),
    );
    const touchmove$ = fromEvent<TouchEvent>(window, 'touchmove', { passive: true });
    const touchend$ = fromEvent<TouchEvent>(window, 'touchend', { passive: true });

    this.subs.add(
      touchstart$
        .pipe(
          switchMap((start) => {
            const touch = start.touches[0];
            let lastX = touch.clientX;
            let lastY = touch.clientY;

            return touchmove$.pipe(
              map((move) => {
                if (move.touches.length !== 1) return null;
                const t = move.touches[0];
                const dx = (t.clientX - lastX) / this.zoom();
                const dy = (t.clientY - lastY) / this.zoom();
                lastX = t.clientX;
                lastY = t.clientY;
                return { dx, dy };
              }),
              takeUntil(touchend$),
              filter(Boolean),
            );
          }),
        )
        .subscribe(({ dx, dy }) => {
          this.panX.update((panX) => panX + dx);
          this.panY.update((panY) => panY + dy);
          this.updateTransform(this.contentRef().nativeElement, true);
        }),
    );
  }

  /**
   * Attaches two-finger pinch zoom behavior to the wrapper.
   */
  private attachPinchZoom(wrapperEl: HTMLElement) {
    const touchstart$ = fromEvent<TouchEvent>(wrapperEl, 'touchstart', { passive: true }).pipe(
      filter((e) => e.touches.length === 2),
    );

    this.subs.add(
      touchstart$
        .pipe(
          switchMap((start) => {
            const [t1, t2] = Array.from(start.touches);
            const startDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            const startScale = this.zoom();

            return fromEvent<TouchEvent>(window, 'touchmove').pipe(
              filter((e) => e.touches.length === 2),
              map((move) => {
                const [m1, m2] = Array.from(move.touches);
                const currDist = Math.hypot(m2.clientX - m1.clientX, m2.clientY - m1.clientY);
                return (currDist / startDist) * startScale;
              }),
              takeUntil(fromEvent(window, 'touchend')),
            );
          }),
        )
        .subscribe((newScale) => {
          // Determine if we need to zoom in or out based on the new scale
          if (newScale > this.zoom()) {
            this.zoomIn(newScale - this.zoom()); // Pass the difference as step
          } else if (newScale < this.zoom()) {
            this.zoomOut(this.zoom() - newScale); // Pass the difference as step
          }
        }),
    );
  }

  /**
   * Attaches wheel-based zoom behavior centered on the cursor.
   */
  private attachWheelZoom(wrapper: HTMLElement) {
    const zoom$ = fromEvent<WheelEvent>(wrapper, 'wheel', { passive: false }).pipe(
      tap((e) => e.preventDefault()),
      map((e) => ({
        delta: -e.deltaY,
        offsetX: e.offsetX, // We'll keep these to potentially pass to adjustPanForZoom for mouse-centric zoom
        offsetY: e.offsetY,
      })),
    );

    this.subs.add(
      zoom$.subscribe(({ delta, offsetX, offsetY }) => {
        const zoomFactor = 0.0015;
        const zoomStep = delta * zoomFactor;

        const oldScale = this.zoom();
        let newScale: number;

        if (zoomStep > 0) {
          newScale = Math.min(this.maxZoom(), oldScale + zoomStep);
        } else {
          newScale = Math.min(this.maxZoom(), Math.max(this.minZoom(), oldScale + zoomStep)); // Subtracting negative zoomStep
        }

        if (newScale !== oldScale) {
          // For wheel zoom, we can zoom towards the mouse cursor
          this.adjustPanForZoom(oldScale, newScale, offsetX, offsetY);
          this.zoom.set(newScale);
          this.updateTransform(this.contentRef().nativeElement, true);
        }
      }),
    );
  }

  /**
   * Attaches mouse drag panning behavior to the wrapper.
   */
  private attachMousePan(wrapperEl: HTMLElement) {
    const mousedown$ = fromEvent<MouseEvent>(wrapperEl, 'mousedown', { passive: false }).pipe(
      tap((e) => {
        e.preventDefault();
        wrapperEl.style.cursor = 'grabbing';
      }),
    );

    const mousemove$ = fromEvent<MouseEvent>(window, 'mousemove', { passive: true });
    const mouseup$ = fromEvent<MouseEvent>(window, 'mouseup', { passive: true }).pipe(
      tap(() => {
        wrapperEl.style.cursor = 'grab';
      }),
    );

    this.subs.add(
      mousedown$
        .pipe(
          switchMap((start) => {
            let lastX = start.clientX;
            let lastY = start.clientY;

            return mousemove$.pipe(
              map((move) => {
                const speedFactor = 0.8 + 0.4 * this.zoom(); // Adjust as needed
                const dx = ((move.clientX - lastX) * speedFactor) / this.zoom();
                const dy = ((move.clientY - lastY) * speedFactor) / this.zoom();
                lastX = move.clientX;
                lastY = move.clientY;
                return { dx, dy };
              }),
              takeUntil(mouseup$),
            );
          }),
        )
        .subscribe(({ dx, dy }) => {
          this.panX.update((panX) => panX + dx);
          this.panY.update((panY) => panY + dy);
          this.updateTransform(this.contentRef().nativeElement, true);
        }),
    );
  }

  /**
   * Attaches double-click reset behavior for zoom and pan.
   */
  private attachDoubleClickReset(wrapperEl: HTMLElement, contentEl: HTMLElement) {
    this.subs.add(
      fromEvent<MouseEvent>(wrapperEl, 'dblclick')
        .pipe(tap((e) => e.preventDefault()))
        .subscribe(() => {
          this.zoom.set(1);
          this.panX.set(0);
          this.panY.set(0);
          this.updateTransform(contentEl);
        }),
    );
  }
}
