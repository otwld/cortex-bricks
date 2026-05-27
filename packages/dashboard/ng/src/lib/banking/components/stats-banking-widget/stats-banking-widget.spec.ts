import { TestBed } from '@angular/core/testing';

import { BankingStatCard, BankingStatCardSelectEvent, StatsBankingWidget } from './stats-banking-widget';

describe(StatsBankingWidget.name, () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatsBankingWidget],
    }).compileComponents();
  });

  it('renders the default banking cards', () => {
    const fixture = TestBed.createComponent(StatsBankingWidget);

    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Debit Card');
    expect(element.textContent).toContain('Credit Card');
    expect(element.textContent).toContain('Primary');
    expect(element.textContent).toContain('Currency');
  });

  it('builds card view models from custom inputs', () => {
    const fixture = TestBed.createComponent(StatsBankingWidget);
    const cards: readonly BankingStatCard[] = [
      { id: 'wallet', title: 'Wallet', value: '$99.00', variant: 'summary', icon: 'pi pi-wallet' },
      { id: 'credit', title: 'Credit', value: '$10.00', variant: 'credit', number: '**** 1111', expiry: '01/30' },
    ];

    fixture.componentRef.setInput('cards', cards);
    fixture.detectChanges();

    const viewModels = (
      fixture.componentInstance as unknown as { cardViewModels: () => Array<{ id: string; wrapperClass: string; logoAlt: string }> }
    ).cardViewModels();

    expect(fixture.nativeElement.textContent).toContain('Wallet');
    expect(viewModels[0].wrapperClass).toContain('xl:col-span-2');
    expect(viewModels[1].logoAlt).toBe('Credit logo');
  });

  it('emits typed card selection events', () => {
    const fixture = TestBed.createComponent(StatsBankingWidget);
    const selections: BankingStatCardSelectEvent[] = [];
    const events: unknown[] = [];

    fixture.componentInstance.cardSelected.subscribe((event) => selections.push(event));
    fixture.componentInstance.events$.subscribe((event) => events.push(event));
    fixture.detectChanges();

    const card = (fixture.componentInstance as unknown as { cardViewModels: () => BankingStatCard[] }).cardViewModels()[0];
    if (!card) throw new Error('Expected a demo banking stat view model.');
    (fixture.componentInstance as unknown as { selectCard(card: BankingStatCard): void }).selectCard(card);

    expect(selections).toEqual([{ card }]);
    expect(events).toEqual([{ type: 'card', card }]);
  });
});
