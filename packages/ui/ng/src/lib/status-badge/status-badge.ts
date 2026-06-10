import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
/**
 * StatusBadgeTone type used across libs/ng/kit.
 */


export type StatusBadgeTone = 'neutral' | 'positive' | 'info' | 'warning' | 'negative';
/**
 * StatusBadgeSize type used across libs/ng/kit.
 */

export type StatusBadgeSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'kit-status-badge',
  template: '{{ label() }}',
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        border: 1px solid transparent;
        font-weight: 600;
        letter-spacing: 0.01em;
        line-height: 1;
        user-select: none;
        white-space: nowrap;
      }

      :host(.kit-status-badge--tone-neutral) {
        background: #eef1f4;
        border-color: #cbd5e1;
        color: #1f2a37;
      }

      :host(.kit-status-badge--tone-positive) {
        background: #e7f7ed;
        border-color: #86efac;
        color: #14532d;
      }

      :host(.kit-status-badge--tone-info) {
        background: #e8f1ff;
        border-color: #9ec5ff;
        color: #1e3a8a;
      }

      :host(.kit-status-badge--tone-warning) {
        background: #fff7e6;
        border-color: #f6c76a;
        color: #7a4b00;
      }

      :host(.kit-status-badge--tone-negative) {
        background: #fdecec;
        border-color: #f2b8b5;
        color: #7f1d1d;
      }

      :host(.kit-status-badge--size-sm) {
        font-size: 0.75rem;
        padding: 0.2rem 0.45rem;
      }

      :host(.kit-status-badge--size-md) {
        font-size: 0.8125rem;
        padding: 0.25rem 0.6rem;
      }

      :host(.kit-status-badge--size-lg) {
        font-size: 0.875rem;
        padding: 0.3rem 0.75rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.aria-label]': 'effectiveAriaLabel()',
  },
})
export class StatusBadgeComponent {
  readonly label = input.required<string>();
  readonly tone = input<StatusBadgeTone>('neutral');
  readonly size = input<StatusBadgeSize>('md');
  readonly ariaLabel = input<string | null>(null);

  protected readonly hostClass = computed(
    () =>
      `kit-status-badge kit-status-badge--tone-${this.tone()} kit-status-badge--size-${this.size()}`
  );

  protected readonly effectiveAriaLabel = computed(() => this.ariaLabel() || null);
}
