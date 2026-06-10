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
  // How much to scale per 100px of scroll (default is 0.1)
  public readonly scaleFactor = input(0.05);
  // Maximum scale value (default is 1.5)
  public readonly maxScale = input(1.2);
  // Minimum scale value (default is 0.5)
  public readonly minScale = input(1);

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
