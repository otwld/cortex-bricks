import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Output,
} from '@angular/core';

@Directive({
  selector: '[kitScrollPercentage]',
  standalone: true,
})
/** Emits how much of the host element is currently visible in the viewport. */
export class ScrollPercentageDirective {
  @Output() scrollPercentageChange = new EventEmitter<number>();

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  @HostListener('window:scroll')
  onScroll(): void {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Calculate how much of the element has been scrolled into view
    const elementHeight = rect.height;
    const elementTop = rect.top;
    const elementBottom = rect.bottom;

    let percentageScrolled;

    if (elementBottom <= 0) {
      // Element is fully above the viewport (not visible)
      percentageScrolled = 0;
    } else if (elementTop >= windowHeight) {
      // Element is fully below the viewport (not visible)
      percentageScrolled = 0;
    } else {
      // Calculate percentage based on how much of the element is visible
      const visiblePart = windowHeight - elementTop;
      percentageScrolled = Math.min(
        100,
        Math.max(0, (visiblePart / elementHeight) * 100),
      );
    }

    // Emit the percentage scrolled
    this.scrollPercentageChange.emit(percentageScrolled);
  }
}
