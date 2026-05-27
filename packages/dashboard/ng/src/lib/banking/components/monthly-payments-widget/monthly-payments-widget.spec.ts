import { TestBed } from '@angular/core/testing';

import { MonthlyPayment, MonthlyPaymentSelectEvent, MonthlyPaymentsWidget } from './monthly-payments-widget';

describe(MonthlyPaymentsWidget.name, () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthlyPaymentsWidget],
    }).compileComponents();
  });

  it('renders the default monthly payments', () => {
    const fixture = TestBed.createComponent(MonthlyPaymentsWidget);

    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Monthly Payments');
    expect(element.textContent).toContain('Electric Bill');
    expect(element.textContent).toContain('COMPLETED');
  });

  it('builds payment view models from custom inputs', () => {
    const fixture = TestBed.createComponent(MonthlyPaymentsWidget);
    const payments: readonly MonthlyPayment[] = [{ id: 'insurance', name: 'Insurance', amount: Number.NaN, paid: false, date: '01/05/2026' }];

    fixture.componentRef.setInput('payments', payments);
    fixture.detectChanges();

    const viewModels = (
      fixture.componentInstance as unknown as { paymentViewModels: () => Array<{ id: string; amount: number; statusLabel: string; severity: string }> }
    ).paymentViewModels();

    expect(fixture.nativeElement.textContent).toContain('Insurance');
    expect(viewModels[0].id).toBe('insurance');
    expect(viewModels[0].amount).toBe(0);
    expect(viewModels[0].statusLabel).toBe('PENDING');
    expect(viewModels[0].severity).toBe('warn');
  });

  it('emits typed payment selection events', () => {
    const fixture = TestBed.createComponent(MonthlyPaymentsWidget);
    const selections: MonthlyPaymentSelectEvent[] = [];
    const events: unknown[] = [];

    fixture.componentInstance.paymentSelected.subscribe((event) => selections.push(event));
    fixture.componentInstance.events$.subscribe((event) => events.push(event));
    fixture.detectChanges();

    const payment = (fixture.componentInstance as unknown as { paymentViewModels: () => MonthlyPayment[] }).paymentViewModels()[0];
    if (!payment) throw new Error('Expected a demo payment view model.');
    (fixture.componentInstance as unknown as { selectPayment(payment: MonthlyPayment): void }).selectPayment(payment);

    expect(selections).toEqual([{ payment }]);
    expect(events).toEqual([{ type: 'payment', payment }]);
  });

  it('renders an empty state when no payments are provided', () => {
    const fixture = TestBed.createComponent(MonthlyPaymentsWidget);

    fixture.componentRef.setInput('payments', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No monthly payments to display.');
  });
});
