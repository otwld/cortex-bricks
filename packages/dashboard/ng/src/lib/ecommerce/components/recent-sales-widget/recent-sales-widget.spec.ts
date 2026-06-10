import { TestBed } from '@angular/core/testing';

import { RecentSale, RecentSaleColumn, RecentSaleSelectionEvent, RecentSalesExportEvent, RecentSalesWidget } from './recent-sales-widget';

describe(RecentSalesWidget.name, () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentSalesWidget],
    }).compileComponents();
  });

  it('renders the default demo sales', () => {
    const fixture = TestBed.createComponent(RecentSalesWidget);

    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Recent Sales');
    expect(element.textContent).toContain('Bamboo Watch');
    expect(element.textContent).toContain('Accessories');
    expect(element.textContent).toContain('INSTOCK');
  });

  it('renders custom sales and columns from inputs', () => {
    const fixture = TestBed.createComponent(RecentSalesWidget);
    const sales: readonly RecentSale[] = [{ id: 'sale-1', name: 'Studio Monitor', category: 'Audio', price: 249, status: 'LOWSTOCK' }];
    const columns: readonly RecentSaleColumn[] = [
      { field: 'name', header: 'Product', sortable: true },
      { field: 'price', header: 'Sale Price', type: 'currency' },
    ];

    fixture.componentRef.setInput('title', 'Latest Orders');
    fixture.componentRef.setInput('sales', sales);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('showViewAction', false);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Latest Orders');
    expect(element.textContent).toContain('Product');
    expect(element.textContent).toContain('Sale Price');
    expect(element.textContent).toContain('Studio Monitor');
    expect(element.textContent).not.toContain('Category');
  });

  it('emits typed selection events', () => {
    const fixture = TestBed.createComponent(RecentSalesWidget);
    const sale: RecentSale = { id: 'sale-1', name: 'Keyboard', category: 'Hardware', price: 129, status: 'INSTOCK' };
    const selections: RecentSaleSelectionEvent[] = [];
    const events: unknown[] = [];

    fixture.componentRef.setInput('sales', [sale]);
    fixture.componentInstance.saleSelected.subscribe((event) => selections.push(event));
    fixture.componentInstance.events$.subscribe((event) => events.push(event));
    fixture.detectChanges();

    const saleViewModel = fixture.componentInstance.saleViewModels()[0];
    if (!saleViewModel) throw new Error('Expected a recent sale view model.');
    fixture.componentInstance.selectSale(saleViewModel);

    expect(selections).toEqual([{ sale }]);
    expect(events).toEqual([{ type: 'select', sale }]);
  });

  it('emits export events with the current rows and columns', () => {
    const fixture = TestBed.createComponent(RecentSalesWidget);
    const sale: RecentSale = { id: 'sale-1', name: 'Keyboard', category: 'Hardware', price: 129, status: 'INSTOCK' };
    const columns: readonly RecentSaleColumn[] = [{ field: 'name', header: 'Product' }];
    const exports: RecentSalesExportEvent[] = [];

    fixture.componentRef.setInput('sales', [sale]);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentInstance.salesExported.subscribe((event) => exports.push(event));
    fixture.detectChanges();

    fixture.componentInstance.exportSales();

    expect(exports).toEqual([{ rows: [sale], columns }]);
  });

  it('debounces search events before updating the table stream', () => {
    vi.useFakeTimers();

    const fixture = TestBed.createComponent(RecentSalesWidget);
    const events: unknown[] = [];

    try {
      fixture.componentInstance.events$.subscribe((event) => events.push(event));
      fixture.detectChanges();

      const input = document.createElement('input');
      input.value = 'watch';
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: input });
      fixture.componentInstance.queueGlobalFilter(event);
      vi.advanceTimersByTime(119);
      expect(events).toEqual([]);

      vi.advanceTimersByTime(1);
      expect(events).toEqual([{ type: 'search', query: 'watch' }]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('renders an empty state when no sales are provided', () => {
    const fixture = TestBed.createComponent(RecentSalesWidget);

    fixture.componentRef.setInput('sales', []);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('No recent sales to display.');
  });
});
