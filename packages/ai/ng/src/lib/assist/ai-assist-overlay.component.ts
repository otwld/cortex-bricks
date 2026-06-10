import { Component, ElementRef, ViewChild, input, output, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Popover, PopoverModule } from 'primeng/popover';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

type AiAssistOverlayStatus = 'idle' | 'loading' | 'generated' | 'error';

/**
 * Floating assist popover controlled by `AiAssistDirective`.
 *
 * The overlay owns presentation state only; callers drive generation,
 * acceptance, retry, and cancellation through inputs, outputs, and imperative
 * state methods.
 */
@Component({
  selector: 'ai-assist-overlay',
  imports: [ButtonModule, PopoverModule, ProgressSpinnerModule],
  template: `
    <button
      #trigger
      pButton
      type="button"
      class="ai-assist-trigger"
      [class.ai-assist-trigger-hidden]="!visible()"
      [style.left.px]="position().left"
      [style.top.px]="position().top"
      [disabled]="disabled()"
      [attr.aria-expanded]="menuVisible()"
      [attr.aria-label]="label()"
      aria-haspopup="dialog"
      (click)="open($event)"
      (focus)="open($event)"
      (mouseenter)="open($event)"
    >
      <span class="ai-assist-trigger-text">AI</span>
    </button>

    <p-popover #popover [appendTo]="'body'" [dismissable]="true" styleClass="ai-assist-popover" (onHide)="onPopoverHide()">
      <div class="ai-assist-menu" role="dialog" aria-live="polite" [attr.aria-label]="label()">
        <div class="ai-assist-header">
          <span class="ai-assist-mark">AI</span>
          <span class="ai-assist-title">Assistant</span>
        </div>

        @switch (status()) {
          @case ('loading') {
            <div class="ai-assist-loading">
              <p-progress-spinner ariaLabel="Generating" strokeWidth="4" styleClass="ai-assist-spinner" />
              <span>Generating</span>
            </div>

            @if (suggestion()) {
              <div class="ai-assist-preview">{{ suggestion() }}</div>
            }
          }
          @case ('generated') {
            <div class="ai-assist-preview">{{ suggestion() }}</div>
            <div class="ai-assist-actions">
              <p-button label="Validate" icon="pi pi-check" size="small" (onClick)="acceptRequested.emit()" />
              <p-button label="Retry" icon="pi pi-refresh" size="small" severity="secondary" [outlined]="true" (onClick)="retryRequested.emit()" />
              <p-button label="Cancel" icon="pi pi-times" size="small" severity="secondary" [text]="true" (onClick)="cancelRequested.emit()" />
            </div>
          }
          @case ('error') {
            <div class="ai-assist-error">
              <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
              <span>{{ errorMessage() }}</span>
            </div>
            <div class="ai-assist-actions">
              <p-button label="Retry" icon="pi pi-refresh" size="small" (onClick)="retryRequested.emit()" />
              <p-button label="Cancel" icon="pi pi-times" size="small" severity="secondary" [text]="true" (onClick)="cancelRequested.emit()" />
            </div>
          }
          @default {
            <div class="ai-assist-actions">
              <p-button label="Run" icon="pi pi-play" size="small" (onClick)="runRequested.emit()" />
              <p-button label="Cancel" icon="pi pi-times" size="small" severity="secondary" [text]="true" (onClick)="cancelRequested.emit()" />
            </div>
          }
        }
      </div>
    </p-popover>
  `,
  styles: `
    :host {
      pointer-events: none;
      position: fixed;
      z-index: 1100;
    }

    :host ::ng-deep .ai-assist-popover {
      max-width: calc(100vw - 2rem);
    }

    :host ::ng-deep .ai-assist-spinner {
      height: 1.25rem;
      width: 1.25rem;
    }

    .ai-assist-trigger {
      align-items: center;
      border-radius: 999px;
      box-shadow: 0 0.5rem 1.25rem color-mix(in srgb, var(--p-primary-color, #2563eb) 28%, transparent);
      display: inline-flex;
      font-size: 0.75rem;
      font-weight: 700;
      height: 2rem;
      justify-content: center;
      letter-spacing: 0;
      min-width: 2rem;
      padding: 0;
      pointer-events: auto;
      position: fixed;
      transition:
        opacity 120ms ease,
        transform 120ms ease;
      width: 2rem;
    }

    .ai-assist-trigger-hidden {
      opacity: 0;
      pointer-events: none;
      transform: scale(0.92);
    }

    .ai-assist-trigger-text {
      line-height: 1;
    }

    .ai-assist-menu {
      display: grid;
      gap: 0.75rem;
      max-width: calc(100vw - 2rem);
      width: min(21rem, calc(100vw - 2rem));
    }

    .ai-assist-header {
      align-items: center;
      display: flex;
      gap: 0.5rem;
      min-width: 0;
    }

    .ai-assist-mark {
      align-items: center;
      background: color-mix(in srgb, var(--p-primary-color, #2563eb) 12%, transparent);
      border: 1px solid color-mix(in srgb, var(--p-primary-color, #2563eb) 32%, transparent);
      border-radius: 999px;
      color: var(--p-primary-color, #2563eb);
      display: inline-flex;
      flex: 0 0 auto;
      font-size: 0.6875rem;
      font-weight: 700;
      height: 1.5rem;
      justify-content: center;
      letter-spacing: 0;
      width: 1.5rem;
    }

    .ai-assist-title {
      color: var(--p-text-color, #111827);
      font-size: 0.875rem;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ai-assist-loading,
    .ai-assist-error {
      align-items: center;
      color: var(--p-text-muted-color, #6b7280);
      display: flex;
      font-size: 0.875rem;
      gap: 0.625rem;
      min-width: 0;
    }

    .ai-assist-error {
      color: var(--p-red-600, #dc2626);
    }

    .ai-assist-preview {
      background: var(--p-content-hover-background, #f8fafc);
      border: 1px solid var(--p-content-border-color, #e5e7eb);
      border-radius: 0.5rem;
      color: var(--p-text-color, #111827);
      font-size: 0.875rem;
      line-height: 1.45;
      max-height: 12rem;
      overflow: auto;
      padding: 0.75rem;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .ai-assist-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: flex-end;
    }
  `,
})
export class AiAssistOverlay {
  /** Accessible label for the trigger and popover dialog. */
  readonly label = input('Run AI assist');

  /** Disables user-triggered opening while an owning directive is unavailable. */
  readonly disabled = input(false);

  /** Emitted when the generated suggestion should be applied. */
  readonly acceptRequested = output<void>();

  /** Emitted when the current assist session should be cancelled. */
  readonly cancelRequested = output<void>();

  /** Emitted when the owning directive should request a new suggestion. */
  readonly retryRequested = output<void>();

  /** Emitted the first time the overlay opens in the idle state. */
  readonly runRequested = output<void>();

  /**
   * Whether the fixed trigger should be visible near the active target.
   */
  readonly visible = signal(false);

  /**
   * Whether the assist popover menu is currently open.
   */
  readonly menuVisible = signal(false);

  /**
   * Fixed trigger position in viewport pixels.
   */
  readonly position = signal({ left: 0, top: 0 });

  /**
   * Current generation lifecycle state rendered by the popover.
   */
  readonly status = signal<AiAssistOverlayStatus>('idle');

  /**
   * Streaming or final suggestion text shown in the preview.
   */
  readonly suggestion = signal('');

  /**
   * Recoverable generation error shown in the popover.
   */
  readonly errorMessage = signal<string | null>(null);

  @ViewChild('popover') private popover?: Popover;
  @ViewChild('trigger') private trigger?: ElementRef<HTMLButtonElement>;

  /** Opens the popover and starts generation when the overlay is idle. */
  open(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.disabled() || !this.visible()) return;

    this.menuVisible.set(true);
    this.popover?.show(event, this.trigger?.nativeElement);

    if (this.status() === 'idle') this.runRequested.emit();
  }

  /** Hides the popover without mutating generated or error state. */
  hide(): void {
    this.menuVisible.set(false);
    this.popover?.hide();
  }

  /** Synchronizes state after the PrimeNG popover closes itself. */
  onPopoverHide(): void {
    this.menuVisible.set(false);
  }

  /** Positions the fixed trigger next to the active text selection or control. */
  setPosition(left: number, top: number, visible: boolean): void {
    this.position.set({ left, top });
    this.visible.set(visible);
  }

  /** Shows the loading state and clears stale output. */
  setLoading(): void {
    this.errorMessage.set(null);
    this.suggestion.set('');
    this.status.set('loading');
  }

  /** Updates the preview while a streamed suggestion is still in progress. */
  setStreamingText(text: string): void {
    this.suggestion.set(text);
  }

  /** Shows the final generated suggestion. */
  setGenerated(text: string): void {
    this.errorMessage.set(null);
    this.suggestion.set(text);
    this.status.set('generated');
  }

  /** Shows a recoverable generation error. */
  setError(message: string): void {
    this.errorMessage.set(message);
    this.status.set('error');
  }

  /** Returns the overlay to the idle state for a future assist session. */
  reset(): void {
    this.errorMessage.set(null);
    this.suggestion.set('');
    this.status.set('idle');
  }
}
