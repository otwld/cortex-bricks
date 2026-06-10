import { Component, DestroyRef, computed, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { Subject } from 'rxjs';

/**
 * Recipient rendered in the send-money widget.
 */
export interface BankingRecipient {
  readonly id: string;
  readonly name: string;
  readonly avatarUrl: string;
  readonly avatarAlt?: string;
}

/**
 * Payload emitted when a recipient is selected.
 */
export interface BankingRecipientSelectEvent {
  readonly recipient: BankingRecipient;
}

/**
 * Payload emitted when the transfer amount changes.
 */
export interface BankingAmountChangeEvent {
  readonly amount: number;
}

/**
 * Payload emitted when the send action is requested.
 */
export interface BankingPaymentSendEvent {
  readonly amount: number;
  readonly recipient: BankingRecipient | null;
}

/**
 * Union of events emitted by the send-money recent transactions widget.
 */
export type RecentTransactionsTwoWidgetEvent =
  | ({ readonly type: 'recipient' } & BankingRecipientSelectEvent)
  | ({ readonly type: 'amount' } & BankingAmountChangeEvent)
  | { readonly type: 'add' }
  | ({ readonly type: 'send' } & BankingPaymentSendEvent);

interface BankingRecipientViewModel extends BankingRecipient {
  readonly avatarAlt: string;
}

const DEFAULT_RECIPIENTS: readonly BankingRecipient[] = [
  { id: 'aisha-williams', name: 'Aisha Williams', avatarUrl: '/demo/images/avatar/circle/avatar-f-1.png' },
  { id: 'jane-watson', name: 'Jane Watson', avatarUrl: '/demo/images/avatar/circle/avatar-f-2.png' },
  { id: 'brad-curry', name: 'Brad Curry', avatarUrl: '/demo/images/avatar/circle/avatar-m-1.png' },
  { id: 'claire-dunphy', name: 'Claire Dunphy', avatarUrl: '/demo/images/avatar/circle/avatar-f-3.png' },
  { id: 'kevin-james', name: 'Kevin James', avatarUrl: '/demo/images/avatar/circle/avatar-m-2.png' },
  { id: 'sarah-mctamish', name: 'Sarah McTamish', avatarUrl: '/demo/images/avatar/circle/avatar-f-4.png' },
];

/**
 * Banking widget for selecting a recent recipient and sending an amount.
 */
@Component({
  standalone: true,
  selector: 'app-recent-transactions-two-widget',
  imports: [FormsModule, InputNumberModule, ButtonModule],
  templateUrl: './recent-transactions-two-widget.html',
})
export class RecentTransactionsTwoWidget {
  private readonly destroyRef = inject(DestroyRef);
  private readonly eventsSubject = new Subject<RecentTransactionsTwoWidgetEvent>();

  /**
   * Widget heading shown above the recipient picker.
   */
  readonly title = input('Recent Transactions');

  /**
   * Recipients rendered in the picker grid.
   */
  readonly recipients = input<readonly BankingRecipient[]>(DEFAULT_RECIPIENTS);

  /**
   * Controlled selected recipient id.
   */
  readonly selectedRecipientId = input<string | null>(null);

  /**
   * Controlled transfer amount.
   */
  readonly amount = input(0);

  /**
   * Currency code passed to PrimeNG InputNumber.
   */
  readonly currencyCode = input('USD');

  /**
   * Locale passed to PrimeNG InputNumber.
   */
  readonly locale = input('en-US');

  /**
   * Input id used by PrimeNG InputNumber for accessibility.
   */
  readonly amountInputId = input('banking-transfer-amount');

  /**
   * Text shown in the add recipient button.
   */
  readonly addButtonLabel = input('Add New');

  /**
   * Text shown in the send button.
   */
  readonly sendButtonLabel = input('Send');

  /**
   * Message shown when no recipients are available.
   */
  readonly emptyMessage = input('No recipients to display.');

  /**
   * Emits when a recipient is selected.
   */
  readonly recipientSelected = output<BankingRecipientSelectEvent>();

  /**
   * Emits when the transfer amount changes.
   */
  readonly amountChanged = output<BankingAmountChangeEvent>();

  /**
   * Emits when the add recipient action is requested.
   */
  readonly addRequested = output<void>();

  /**
   * Emits when the send action is requested.
   */
  readonly paymentSent = output<BankingPaymentSendEvent>();

  /**
   * RxJS stream of all user events emitted by this widget.
   */
  readonly events$ = this.eventsSubject.asObservable();

  public readonly recipientViewModels = computed(() => this.recipients().map((recipient) => this.toRecipientViewModel(recipient)));

  public readonly recipientRows = computed(() => this.chunkRecipients(this.recipientViewModels(), 2));

  protected readonly selectedRecipient = computed(() => this.recipientViewModels().find((recipient) => recipient.id === this.selectedRecipientId()) ?? null);

  constructor() {
    this.destroyRef.onDestroy(() => this.eventsSubject.complete());
  }

  public selectRecipient(recipient: BankingRecipient): void {
    const event = { recipient };

    this.recipientSelected.emit(event);
    this.eventsSubject.next({ type: 'recipient', ...event });
  }

  public changeAmount(amount: number | string | null): void {
    const normalizedAmount = this.normalizeAmount(amount);
    const event = { amount: normalizedAmount };

    this.amountChanged.emit(event);
    this.eventsSubject.next({ type: 'amount', ...event });
  }

  public requestAdd(): void {
    this.addRequested.emit();
    this.eventsSubject.next({ type: 'add' });
  }

  public sendPayment(): void {
    const event = {
      amount: this.normalizeAmount(this.amount()),
      recipient: this.selectedRecipient(),
    };

    this.paymentSent.emit(event);
    this.eventsSubject.next({ type: 'send', ...event });
  }

  private toRecipientViewModel(recipient: BankingRecipient): BankingRecipientViewModel {
    return {
      ...recipient,
      avatarAlt: recipient.avatarAlt ?? `${recipient.name} avatar`,
    };
  }

  private chunkRecipients(recipients: readonly BankingRecipientViewModel[], size: number): readonly BankingRecipientViewModel[][] {
    const rows: BankingRecipientViewModel[][] = [];

    for (let index = 0; index < recipients.length; index += size) {
      rows.push(recipients.slice(index, index + size));
    }

    return rows;
  }

  private normalizeAmount(amount: number | string | null): number {
    const value = typeof amount === 'string' ? Number(amount) : amount;

    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }
}
