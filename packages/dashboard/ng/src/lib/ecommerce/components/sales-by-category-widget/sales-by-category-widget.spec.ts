import { TestBed } from '@angular/core/testing';

import { SalesByCategoryDataSelectEvent, SalesByCategoryItem, SalesByCategoryWidget } from './sales-by-category-widget';

describe(SalesByCategoryWidget.name, () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesByCategoryWidget],
    }).compileComponents();
  });

  it('renders the default category sales chart', () => {
    const fixture = TestBed.createComponent(SalesByCategoryWidget);

    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Sales by Category');
  });

  it('builds chart data from custom categories', () => {
    const fixture = TestBed.createComponent(SalesByCategoryWidget);
    const categories: readonly SalesByCategoryItem[] = [
      { id: 'hardware', label: 'Hardware', value: 1200, backgroundColor: '#123456', hoverBackgroundColor: '#234567' },
      { id: 'services', label: 'Services', value: Number.NaN, tone: 'orange' },
    ];

    fixture.componentRef.setInput('title', 'Category Mix');
    fixture.componentRef.setInput('categories', categories);
    fixture.detectChanges();

    const chartData = (
      fixture.componentInstance as unknown as {
        chartData: () => {
          labels?: unknown;
          datasets: Array<{ data: number[]; backgroundColor: string[]; hoverBackgroundColor: string[] }>;
        };
      }
    ).chartData();

    expect(fixture.nativeElement.textContent).toContain('Category Mix');
    expect(chartData.labels).toEqual(['Hardware', 'Services']);
    expect(chartData.datasets[0].data).toEqual([1200, 0]);
    expect(chartData.datasets[0].backgroundColor[0]).toBe('#123456');
    expect(chartData.datasets[0].hoverBackgroundColor[0]).toBe('#234567');
  });

  it('uses provided Chart.js options when supplied', () => {
    const fixture = TestBed.createComponent(SalesByCategoryWidget);
    const options = { maintainAspectRatio: true };

    fixture.componentRef.setInput('options', options);
    fixture.detectChanges();

    const resolvedOptions = (fixture.componentInstance as unknown as { resolvedChartOptions: () => unknown }).resolvedChartOptions();

    expect(resolvedOptions).toBe(options);
  });

  it('emits typed chart data selection events with the selected category', () => {
    const fixture = TestBed.createComponent(SalesByCategoryWidget);
    const selections: SalesByCategoryDataSelectEvent[] = [];
    const events: unknown[] = [];
    const chartEvent = { element: { index: 1 } };

    fixture.componentInstance.dataSelected.subscribe((event) => selections.push(event));
    fixture.componentInstance.events$.subscribe((event) => events.push(event));
    fixture.detectChanges();

    (fixture.componentInstance as unknown as { selectChartData(event: unknown): void }).selectChartData(chartEvent);

    const selection = selections[0];
    if (!selection) throw new Error('Expected a category selection event.');
    const streamEvent = events[0] as { type: string; event: unknown; category: SalesByCategoryItem | null };

    expect(selection.event).toBe(chartEvent);
    expect(selection.category?.id).toBe('fashion');
    expect(streamEvent).toEqual({ type: 'data', event: chartEvent, category: selection.category });
  });

  it('renders an empty state when no categories are provided', () => {
    const fixture = TestBed.createComponent(SalesByCategoryWidget);

    fixture.componentRef.setInput('categories', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No category sales to display.');
  });
});
