import {
  Directive,
  ElementRef,
  HostListener, inject,
  input,
  Renderer2,
} from '@angular/core';

/**
 * Directive to scale an element based on the scroll position.
 */
@Directive({
  selector: '[kitScrollScale]',
  standalone: true,
})
/** Scales the host element as the window scroll position changes. */
export class ScrollScaleDirective {
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  /**
   * Scale increment applied for each 100px of window scroll.
   */
  public readonly scaleFactor = input(0.05);

  /**
   * Maximum scale applied to the host element.
   */
  public readonly maxScale = input(1.2);

  /**
   * Minimum scale applied to the host element.
   */
  public readonly minScale = input(1);

  /**
   * Recomputes and applies the host transform whenever the window scrolls.
   */
  @HostListener('window:scroll')
  onWindowScroll() {
    const scrollPosition = window.scrollY;
    const scale = this.calculateScale(scrollPosition);

    this.renderer.setStyle(
      this.el.nativeElement,
      'transform',
      `scale(${scale})`,
    );
    this.renderer.setStyle(
      this.el.nativeElement,
      'transition',
      'transform 0.1s ease-out',
    );
  }

  private calculateScale(scrollPos: number): number {
    // Scale calculation
    const scale = 1 + (scrollPos / 100) * this.scaleFactor();

    // Limit scaling within minScale and maxScale
    return Math.min(this.maxScale(), Math.max(this.minScale(), scale));
  }
}
