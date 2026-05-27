import { TestBed } from '@angular/core/testing';

import { BankingTransaction, BankingTransactionSelectEvent, RecentTransactionsWidget } from './recent-transactions-widget';

describe(RecentTransactionsWidget.name, () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentTransactionsWidget],
    }).compileComponents();
  });

  it('renders the default recent transactions', () => {
    const fixture = TestBed.createComponent(RecentTransactionsWidget);

    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Recent Transactions');
    expect(element.textContent).toContain('Airbnb');
    expect(element.textContent).toContain('$250.00');
  });

  it('builds transaction view models from custom inputs', () => {
    const fixture = TestBed.createComponent(RecentTransactionsWidget);
    const transactions: readonly BankingTransaction[] = [
      { id: 'one', merchant: 'One', date: '01/01/2026', amount: Number.NaN, imageUrl: '/one.png' },
      { id: 'two', merchant: 'Two', date: '01/02/2026', amount: 20, imageUrl: '/two.png' },
    ];

    fixture.componentRef.setInput('transactions', transactions);
    fixture.componentRef.setInput('maxTransactions', 1);
    fixture.detectChanges();

    const viewModels = (
      fixture.componentInstance as unknown as { transactionViewModels: () => Array<{ id: string; amount: number; imageAlt: string }> }
    ).transactionViewModels();

    expect(fixture.nativeElement.textContent).toContain('One');
    expect(fixture.nativeElement.textContent).not.toContain('Two');
    expect(viewModels[0].amount).toBe(0);
    expect(viewModels[0].imageAlt).toBe('One logo');
  });

  it('emits typed transaction selection events', () => {
    const fixture = TestBed.createComponent(RecentTransactionsWidget);
    const selections: BankingTransactionSelectEvent[] = [];
    const events: unknown[] = [];

    fixture.componentInstance.transactionSelected.subscribe((event) => selections.push(event));
    fixture.componentInstance.events$.subscribe((event) => events.push(event));
    fixture.detectChanges();

    const transaction = (fixture.componentInstance as unknown as { transactionViewModels: () => BankingTransaction[] }).transactionViewModels()[0];
    if (!transaction) throw new Error('Expected a demo transaction view model.');
    (fixture.componentInstance as unknown as { selectTransaction(transaction: BankingTransaction): void }).selectTransaction(transaction);

    expect(selections).toEqual([{ transaction }]);
    expect(events).toEqual([{ type: 'transaction', transaction }]);
  });

  it('renders an empty state when no transactions are provided', () => {
    const fixture = TestBed.createComponent(RecentTransactionsWidget);

    fixture.componentRef.setInput('transactions', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No recent transactions to display.');
  });
});
