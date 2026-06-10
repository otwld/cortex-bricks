import { Component, DestroyRef, computed, inject, input, output } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { Subject } from 'rxjs';

/**
 * Visual card variant rendered by the banking stats widget.
 */
export type BankingStatCardVariant = 'debit' | 'credit' | 'summary';

/**
 * Banking card or account summary rendered in the stats area.
 */
export interface BankingStatCard {
  readonly id: string;
  readonly title: string;
  readonly value: string;
  readonly variant: BankingStatCardVariant;
  readonly label?: string;
  readonly number?: string;
  readonly expiry?: string;
  readonly icon?: string;
  readonly logoSrc?: string;
  readonly logoAlt?: string;
}

/**
 * Payload emitted when a stats card action is selected.
 */
export interface BankingStatCardSelectEvent {
  readonly card: BankingStatCard;
}

/**
 * Union of events emitted by the banking stats widget.
 */
export type StatsBankingWidgetEvent = { readonly type: 'card' } & BankingStatCardSelectEvent;

interface BankingStatCardViewModel extends BankingStatCard {
  readonly wrapperClass: string;
  readonly titleClass: string;
  readonly mutedClass: string;
  readonly valueClass: string;
  readonly logoAlt: string;
}

const DEFAULT_CARDS: readonly BankingStatCard[] = [
  {
    id: 'debit-card',
    title: 'Debit Card',
    label: 'Balance',
    value: '$2.000,00',
    number: '**** **** **** 1412',
    expiry: '12/26',
    variant: 'debit',
  },
  {
    id: 'credit-card',
    title: 'Credit Card',
    label: 'Debt',
    value: '$1.500,00',
    number: '**** **** **** 1231',
    expiry: '12/24',
    logoSrc: '/demo/images/banking/visa.svg',
    logoAlt: 'Visa',
    variant: 'credit',
  },
  {
    id: 'primary',
    title: 'Primary',
    value: '$24,345.21',
    icon: 'pi pi-dollar',
    variant: 'summary',
  },
  {
    id: 'currency',
    title: 'Currency',
    value: '$10,416.11',
    icon: 'pi pi-euro',
    variant: 'summary',
  },
];

/**
 * Banking widget that displays debit, credit, and balance summary cards.
 */
@Component({
  standalone: true,
  selector: 'app-stats-banking-widget',
  imports: [ButtonModule],
  templateUrl: './stats-banking-widget.html',
  host: {
    '[style.display]': '"contents"',
  },
})
export class StatsBankingWidget {
  private readonly destroyRef = inject(DestroyRef);
  private readonly eventsSubject = new Subject<StatsBankingWidgetEvent>();

  /**
   * Banking cards and account summaries rendered by the widget.
   */
  readonly cards = input<readonly BankingStatCard[]>(DEFAULT_CARDS);

  /**
   * Controls whether per-card action buttons are rendered.
   */
  readonly showCardActions = input(false);

  /**
   * Emits when a stats card is selected.
   */
  readonly cardSelected = output<BankingStatCardSelectEvent>();

  /**
   * RxJS stream of all user events emitted by this widget.
   */
  readonly events$ = this.eventsSubject.asObservable();

  protected readonly cardViewModels = computed(() => this.cards().map((card) => this.toCardViewModel(card)));

  constructor() {
    this.destroyRef.onDestroy(() => this.eventsSubject.complete());
  }

  protected selectCard(card: BankingStatCard): void {
    const event = { card };

    this.cardSelected.emit(event);
    this.eventsSubject.next({ type: 'card', ...event });
  }

  private toCardViewModel(card: BankingStatCard): BankingStatCardViewModel {
    const isSummary = card.variant === 'summary';
    const isDebit = card.variant === 'debit';

    return {
      ...card,
      wrapperClass: isSummary ? 'col-span-12 md:col-span-6 xl:col-span-2' : 'col-span-12 md:col-span-6 xl:col-span-4',
      titleClass: isDebit ? 'text-xl font-semibold text-white' : 'text-xl font-semibold text-surface-900 dark:text-surface-0',
      mutedClass: isDebit ? 'text-white/90' : 'text-surface-600 dark:text-surface-200',
      valueClass: isDebit ? 'text-white' : 'text-primary',
      logoAlt: card.logoAlt ?? `${card.title} logo`,
    };
  }
}
