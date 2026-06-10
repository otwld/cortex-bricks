import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Text labels rendered by the reusable confirmation dialog.
 */
export interface ConfirmDialogData {
  title?: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

/**
 * Small confirmation dialog that emits explicit confirm and cancel events.
 */
@Component({
  selector: 'kit-confirm-dialog',
  standalone: true,
  template: `
    <section class="kit-confirm-dialog" role="dialog" aria-modal="true">
      <h2>{{ title() || 'Confirm' }}</h2>
      <p>{{ body() || 'Are you sure?' }}</p>
      <div class="kit-confirm-dialog__actions">
        <button type="button" class="kit-confirm-dialog__cancel" (click)="cancel.emit()">
          {{ cancelLabel() || 'No' }}
        </button>
        <button type="button" class="kit-confirm-dialog__confirm" (click)="confirm.emit()">
          {{ confirmLabel() || 'Yes' }}
        </button>
      </div>
    </section>
  `,
  styles: [
    `
      .kit-confirm-dialog {
        display: grid;
        gap: 1rem;
        min-width: min(100%, 22rem);
        padding: 1rem;
      }

      h2,
      p {
        margin: 0;
      }

      h2 {
        font-size: 1.125rem;
        font-weight: 700;
      }

      p {
        color: #475569;
        line-height: 1.5;
      }

      .kit-confirm-dialog__actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
      }

      button {
        border-radius: 0.375rem;
        border: 1px solid #cbd5e1;
        padding: 0.5rem 0.75rem;
        font: inherit;
        cursor: pointer;
      }

      .kit-confirm-dialog__confirm {
        border-color: #dc2626;
        background: #dc2626;
        color: white;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  /** Dialog title text. */
  readonly title = input<string | null>(null);

  /** Dialog body text. */
  readonly body = input<string | null>(null);

  /** Label for the destructive or primary confirmation action. */
  readonly confirmLabel = input<string | null>(null);

  /** Label for the cancellation action. */
  readonly cancelLabel = input<string | null>(null);

  /** Emitted when the user confirms the action. */
  readonly confirm = output<void>();

  /** Emitted when the user cancels the action. */
  readonly cancel = output<void>();
}
