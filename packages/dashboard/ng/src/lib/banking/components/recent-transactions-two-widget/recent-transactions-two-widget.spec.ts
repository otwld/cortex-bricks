import { TestBed } from '@angular/core/testing';

import {
  BankingAmountChangeEvent,
  BankingPaymentSendEvent,
  BankingRecipient,
  BankingRecipientSelectEvent,
  RecentTransactionsTwoWidget,
} from './recent-transactions-two-widget';

describe(RecentTransactionsTwoWidget.name, () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentTransactionsTwoWidget],
    }).compileComponents();
  });

  it('renders the default recipients and controls', () => {
    const fixture = TestBed.createComponent(RecentTransactionsTwoWidget);

    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Recent Transactions');
    expect(element.textContent).toContain('Aisha Williams');
    expect(element.textContent).toContain('Send');
  });

  it('builds recipient rows from custom inputs', () => {
    const fixture = TestBed.createComponent(RecentTransactionsTwoWidget);
    const recipients: readonly BankingRecipient[] = [
      { id: 'one', name: 'One', avatarUrl: '/one.png' },
      { id: 'two', name: 'Two', avatarUrl: '/two.png' },
      { id: 'three', name: 'Three', avatarUrl: '/three.png' },
    ];

    fixture.componentRef.setInput('recipients', recipients);
    fixture.detectChanges();

    const rows = (fixture.componentInstance as unknown as { recipientRows: () => BankingRecipient[][] }).recipientRows();

    expect(rows.length).toBe(2);
    expect(rows[0].map((recipient) => recipient.id)).toEqual(['one', 'two']);
    expect(rows[1].map((recipient) => recipient.id)).toEqual(['three']);
  });

  it('emits typed recipient, amount, add, and send events', () => {
    const fixture = TestBed.createComponent(RecentTransactionsTwoWidget);
    const recipientSelections: BankingRecipientSelectEvent[] = [];
    const amountChanges: BankingAmountChangeEvent[] = [];
    const sends: BankingPaymentSendEvent[] = [];
    const adds: void[] = [];
    const events: unknown[] = [];

    fixture.componentRef.setInput('selectedRecipientId', 'aisha-williams');
    fixture.componentRef.setInput('amount', 125);
    fixture.componentInstance.recipientSelected.subscribe((event) => recipientSelections.push(event));
    fixture.componentInstance.amountChanged.subscribe((event) => amountChanges.push(event));
    fixture.componentInstance.addRequested.subscribe((event) => adds.push(event));
    fixture.componentInstance.paymentSent.subscribe((event) => sends.push(event));
    fixture.componentInstance.events$.subscribe((event) => events.push(event));
    fixture.detectChanges();

    const recipient = (fixture.componentInstance as unknown as { recipientViewModels: () => BankingRecipient[] }).recipientViewModels()[0];
    if (!recipient) throw new Error('Expected a demo recipient view model.');
    const component = fixture.componentInstance as unknown as {
      selectRecipient(recipient: BankingRecipient): void;
      changeAmount(amount: number): void;
      requestAdd(): void;
      sendPayment(): void;
    };

    component.selectRecipient(recipient);
    component.changeAmount(250);
    component.requestAdd();
    component.sendPayment();

    expect(recipientSelections).toEqual([{ recipient }]);
    expect(amountChanges).toEqual([{ amount: 250 }]);
    expect(adds.length).toBe(1);
    expect(sends[0]).toEqual({ amount: 125, recipient });
    expect(events).toEqual([{ type: 'recipient', recipient }, { type: 'amount', amount: 250 }, { type: 'add' }, { type: 'send', amount: 125, recipient }]);
  });

  it('renders an empty state when no recipients are provided', () => {
    const fixture = TestBed.createComponent(RecentTransactionsTwoWidget);

    fixture.componentRef.setInput('recipients', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No recipients to display.');
  });
});
