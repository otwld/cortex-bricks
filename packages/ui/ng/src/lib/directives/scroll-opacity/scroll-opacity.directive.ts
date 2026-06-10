import {
  Directive,
  ElementRef,
  input,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';

@Directive({
  selector: '[kitScrollOpacity]',
  standalone: true,
})
/** Maps element visibility to host opacity with an intersection observer. */
export class ScrollOpacityDirective implements OnInit, OnDestroy {
  // Minimum opacity value
  public readonly minOpacity = input(0);
  // Maximum opacity value
  public readonly maxOpacity = input(1.0);

  private observer: IntersectionObserver | undefined;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  ngOnInit(): void {
    this.createObserver();
  }

  private createObserver(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const visibilityRatio = entry.intersectionRatio;
          const opacity = this.calculateOpacity(visibilityRatio);
          this.renderer.setStyle(this.el.nativeElement, 'opacity', opacity);
        });
      },
      {
        threshold: this.generateThresholds(),
      },
    );

    // Observe the element
    this.observer.observe(this.el.nativeElement);
  }

  private generateThresholds(): number[] {
    const thresholds = [];
    for (let i = 0; i <= 1; i += 0.1) {
      thresholds.push(i);
    }
    return thresholds;
  }

  private calculateOpacity(visibilityRatio: number): number {
    const opacityRange = this.maxOpacity() - this.minOpacity();
    return this.minOpacity() + opacityRange * visibilityRatio;
  }

  ngOnDestroy(): void {
    // Disconnect the observer when the directive is destroyed
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
