import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, input, output } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { Subject } from 'rxjs';

/**
 * Transaction summary rendered by the compact recent transactions widget.
 */
export interface BankingTransaction {
  readonly id: string;
  readonly merchant: string;
  readonly date: string;
  readonly amount: number;
  readonly imageUrl: string;
  readonly imageAlt?: string;
  readonly roundedImage?: boolean;
}

/**
 * Payload emitted when a transaction is selected.
 */
export interface BankingTransactionSelectEvent {
  readonly transaction: BankingTransaction;
}

/**
 * Union of events emitted by the compact recent transactions widget.
 */
export type RecentTransactionsWidgetEvent = { readonly type: 'transaction' } & BankingTransactionSelectEvent;

interface BankingTransactionViewModel extends BankingTransaction {
  readonly amount: number;
  readonly imageAlt: string;
  readonly imageClass: string;
}

const DEFAULT_TRANSACTIONS: readonly BankingTransaction[] = [
  { id: 'airbnb-052322', merchant: 'Airbnb', date: '05/23/2022', amount: 250, imageUrl: '/demo/images/banking/airbnb.png' },
  { id: 'amazon-041222', merchant: 'Amazon', date: '04/12/2022', amount: 50, imageUrl: '/demo/images/banking/amazon.png' },
  { id: 'nike-042922', merchant: 'Nike Store', date: '04/29/2022', amount: 60, imageUrl: '/demo/images/banking/nike.svg', roundedImage: true },
  { id: 'starbucks-041522', merchant: 'Starbucks', date: '04/15/2022', amount: 15.24, imageUrl: '/demo/images/banking/starbucks.svg' },
  { id: 'amazon-041222-small', merchant: 'Amazon', date: '04/12/2022', amount: 12.5, imageUrl: '/demo/images/banking/amazon.png' },
];

/**
 * Banking widget that renders a compact list of recent merchant transactions.
 */
@Component({
  standalone: true,
  selector: 'app-recent-transactions-widget',
  imports: [ButtonModule, CurrencyPipe],
  templateUrl: './recent-transactions-widget.html',
})
export class RecentTransactionsWidget {
  private readonly destroyRef = inject(DestroyRef);
  private readonly eventsSubject = new Subject<RecentTransactionsWidgetEvent>();

  /**
   * Widget heading shown above the transaction list.
   */
  readonly title = input('Recent Transactions');

  /**
   * Transactions rendered by the widget.
   */
  readonly transactions = input<readonly BankingTransaction[]>(DEFAULT_TRANSACTIONS);

  /**
   * Maximum number of transactions displayed.
   */
  readonly maxTransactions = input(5);

  /**
   * Controls whether per-transaction action buttons are rendered.
   */
  readonly showTransactionActions = input(false);

  /**
   * Currency code passed to Angular's currency pipe.
   */
  readonly currencyCode = input('USD');

  /**
   * Currency display format passed to Angular's currency pipe.
   */
  readonly currencyDisplay = input<'code' | 'symbol' | 'symbol-narrow' | string | boolean>('symbol');

  /**
   * Digit info passed to Angular's currency pipe.
   */
  readonly currencyDigits = input('1.2-2');

  /**
   * Message shown when no transactions are available.
   */
  readonly emptyMessage = input('No recent transactions to display.');

  /**
   * Emits when a transaction is selected.
   */
  readonly transactionSelected = output<BankingTransactionSelectEvent>();

  /**
   * RxJS stream of all user events emitted by this widget.
   */
  readonly events$ = this.eventsSubject.asObservable();

  public readonly transactionViewModels = computed(() =>
    this.transactions()
      .slice(0, this.limit())
      .map((transaction) => this.toTransactionViewModel(transaction)),
  );

  constructor() {
    this.destroyRef.onDestroy(() => this.eventsSubject.complete());
  }

  public selectTransaction(transaction: BankingTransaction): void {
    const event = { transaction };

    this.transactionSelected.emit(event);
    this.eventsSubject.next({ type: 'transaction', ...event });
  }

  private toTransactionViewModel(transaction: BankingTransaction): BankingTransactionViewModel {
    return {
      ...transaction,
      amount: Number.isFinite(transaction.amount) ? transaction.amount : 0,
      imageAlt: transaction.imageAlt ?? `${transaction.merchant} logo`,
      imageClass: transaction.roundedImage ? 'mr-0 w-12 shrink-0 rounded-full' : 'mr-0 w-12 shrink-0',
    };
  }

  private limit(): number {
    const maxTransactions = this.maxTransactions();

    if (!Number.isFinite(maxTransactions)) {
      return DEFAULT_TRANSACTIONS.length;
    }

    return Math.max(0, Math.floor(maxTransactions));
  }
}
