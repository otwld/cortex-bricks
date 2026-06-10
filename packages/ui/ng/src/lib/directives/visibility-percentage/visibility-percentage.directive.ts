import {
  Directive,
  ElementRef,
  Output,
  EventEmitter,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';

@Directive({
  selector: '[kitVisibilityPercentage]',
  standalone: true,
})
/** Emits rounded intersection visibility percentages for the host element. */
export class VisibilityPercentageDirective implements AfterViewInit, OnDestroy {
  @Output() visibilityChange = new EventEmitter<number>();

  private observer: IntersectionObserver | undefined;

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    this.createObserver();
  }

  private createObserver(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const visibilityPercentage = Math.round(
            entry.intersectionRatio * 100,
          );
          this.visibilityChange.emit(visibilityPercentage);
        });
      },
      {
        threshold: Array.from({ length: 101 }, (_, index) => index / 100), // Generate thresholds from 0 to 1 in steps of 0.01
      },
    );

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
