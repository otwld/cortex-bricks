import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Visual tone used by `BannerComponent` to communicate message severity.
 */
export type BannerTone = 'neutral' | 'positive' | 'info' | 'warning' | 'negative';

/**
 * Callout surface with projected title, body, and action slots.
 */
@Component({
  selector: 'kit-banner',
  template: `
    <div class="kit-banner__surface">
      <div class="kit-banner__text">
        <div class="kit-banner__title">
          <ng-content select="[kit-banner-title]"></ng-content>
        </div>
        <div class="kit-banner__body">
          <ng-content select="[kit-banner-body]"></ng-content>
        </div>
      </div>
      <div class="kit-banner__actions">
        <ng-content select="[kit-banner-actions]"></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        box-sizing: border-box;
        border-radius: 12px;
        border: 1px solid transparent;
        padding: 0.85rem 1rem;
        font-family: inherit;
      }

      :host(.kit-banner--tone-neutral) {
        background: #f5f7fa;
        border-color: #d6dde6;
        color: #1f2a37;
      }

      :host(.kit-banner--tone-positive) {
        background: #e7f7ed;
        border-color: #86efac;
        color: #14532d;
      }

      :host(.kit-banner--tone-info) {
        background: #e8f1ff;
        border-color: #9ec5ff;
        color: #1e3a8a;
      }

      :host(.kit-banner--tone-warning) {
        background: #fff7e6;
        border-color: #f6c76a;
        color: #7a4b00;
      }

      :host(.kit-banner--tone-negative) {
        background: #fdecec;
        border-color: #f2b8b5;
        color: #7f1d1d;
      }

      .kit-banner__surface {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
      }

      .kit-banner__text {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      .kit-banner__title {
        font-size: 0.95rem;
        font-weight: 600;
        letter-spacing: 0.01em;
      }

      .kit-banner__body {
        font-size: 0.875rem;
        line-height: 1.4;
      }

      .kit-banner__actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .kit-banner__title:empty,
      .kit-banner__body:empty,
      .kit-banner__actions:empty {
        display: none;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.aria-label]': 'effectiveAriaLabel()',
  },
})
export class BannerComponent {
  /** Visual tone applied to the banner surface. */
  readonly tone = input<BannerTone>('neutral');

  /** Optional accessible label when projected text is not descriptive enough. */
  readonly ariaLabel = input<string | null>(null);

  protected readonly hostClass = computed(() => `kit-banner kit-banner--tone-${this.tone()}`);
  protected readonly effectiveAriaLabel = computed(() => this.ariaLabel() || null);
}
