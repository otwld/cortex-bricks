import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, input, output } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Subject } from 'rxjs';

export type MonthlyPaymentStatus = 'completed' | 'pending';

/**
 * Monthly payment row rendered by the widget table.
 */
export interface MonthlyPayment {
  readonly id: string;
  readonly name: string;
  readonly amount: number;
  readonly paid: boolean;
  readonly date: string;
}

/**
 * Payload emitted when a payment is selected.
 */
export interface MonthlyPaymentSelectEvent {
  readonly payment: MonthlyPayment;
}

export type MonthlyPaymentsWidgetEvent = { readonly type: 'payment' } & MonthlyPaymentSelectEvent;

interface MonthlyPaymentViewModel extends MonthlyPayment {
  readonly amount: number;
  readonly status: MonthlyPaymentStatus;
  readonly statusLabel: string;
  readonly severity: 'success' | 'warn';
}

const DEFAULT_PAYMENTS: readonly MonthlyPayment[] = [
  { id: 'electric-bill', name: 'Electric Bill', amount: 75.6, paid: true, date: '06/04/2022' },
  { id: 'water-bill', name: 'Water Bill', amount: 45.5, paid: true, date: '07/04/2022' },
  { id: 'gas-bill', name: 'Gas Bill', amount: 45.2, paid: false, date: '12/04/2022' },
  { id: 'internet-bill', name: 'Internet Bill', amount: 25.9, paid: true, date: '17/04/2022' },
  { id: 'streaming', name: 'Streaming', amount: 40.9, paid: false, date: '20/04/2022' },
];

@Component({
  standalone: true,
  selector: 'app-monthly-payments-widget',
  imports: [ButtonModule, CurrencyPipe, TableModule, TagModule],
  templateUrl: './monthly-payments-widget.html',
})
export class MonthlyPaymentsWidget {
  private readonly destroyRef = inject(DestroyRef);
  private readonly eventsSubject = new Subject<MonthlyPaymentsWidgetEvent>();

  /**
   * Widget heading shown above the payments table.
   */
  readonly title = input('Monthly Payments');

  /**
   * Payment rows rendered by the table.
   */
  readonly payments = input<readonly MonthlyPayment[]>(DEFAULT_PAYMENTS);

  /**
   * Number of rows configured on the PrimeNG table.
   */
  readonly rows = input(5);

  /**
   * Controls whether per-payment action buttons are rendered.
   */
  readonly showPaymentActions = input(false);

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
   * Message shown when no payments are available.
   */
  readonly emptyMessage = input('No monthly payments to display.');

  /**
   * Emits when a payment is selected.
   */
  readonly paymentSelected = output<MonthlyPaymentSelectEvent>();

  /**
   * RxJS stream of all user events emitted by this widget.
   */
  readonly events$ = this.eventsSubject.asObservable();

  protected readonly paymentViewModels = computed(() => this.payments().map((payment) => this.toPaymentViewModel(payment)));

  constructor() {
    this.destroyRef.onDestroy(() => this.eventsSubject.complete());
  }

  protected selectPayment(payment: MonthlyPayment): void {
    const event = { payment };

    this.paymentSelected.emit(event);
    this.eventsSubject.next({ type: 'payment', ...event });
  }

  private toPaymentViewModel(payment: MonthlyPayment): MonthlyPaymentViewModel {
    const status = payment.paid ? 'completed' : 'pending';

    return {
      ...payment,
      amount: Number.isFinite(payment.amount) ? payment.amount : 0,
      status,
      statusLabel: status.toUpperCase(),
      severity: payment.paid ? 'success' : 'warn',
    };
  }
}
