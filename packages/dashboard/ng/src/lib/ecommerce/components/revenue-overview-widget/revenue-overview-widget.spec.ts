import { TestBed } from '@angular/core/testing';

import { RevenueOverviewDataSelectEvent, RevenueOverviewPeriod, RevenueOverviewPeriodChangeEvent, RevenueOverviewWidget } from './revenue-overview-widget';

describe(RevenueOverviewWidget.name, () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RevenueOverviewWidget],
    }).compileComponents();
  });

  it('renders the default revenue overview', () => {
    const fixture = TestBed.createComponent(RevenueOverviewWidget);

    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    const selectedPeriod = (fixture.componentInstance as unknown as { selectedPeriod: () => RevenueOverviewPeriod | null }).selectedPeriod();

    expect(element.textContent).toContain('Revenue Overview');
    expect(selectedPeriod?.label).toBe('Last Week');
  });

  it('builds chart data from custom labels and periods', () => {
    const fixture = TestBed.createComponent(RevenueOverviewWidget);
    const periods: readonly RevenueOverviewPeriod[] = [
      {
        id: 'quarter',
        label: 'Quarter',
        series: [{ id: 'revenue', label: 'Revenue', data: [12, Number.NaN, 34], backgroundColor: '#123456' }],
      },
    ];

    fixture.componentRef.setInput('title', 'Net Revenue');
    fixture.componentRef.setInput('labels', ['Jan', 'Feb', 'Mar']);
    fixture.componentRef.setInput('periods', periods);
    fixture.detectChanges();

    const chartData = (fixture.componentInstance as unknown as { chartData: () => { labels?: unknown; datasets: Array<{ data: number[] }> } }).chartData();

    expect(fixture.nativeElement.textContent).toContain('Net Revenue');
    expect(chartData.labels).toEqual(['Jan', 'Feb', 'Mar']);
    expect(chartData.datasets[0].data).toEqual([12, 0, 34]);
  });

  it('uses a controlled selected period id when provided', () => {
    const fixture = TestBed.createComponent(RevenueOverviewWidget);
    const periods: readonly RevenueOverviewPeriod[] = [
      { id: 'last', label: 'Last', series: [{ id: 'revenue', label: 'Revenue', data: [1] }] },
      { id: 'current', label: 'Current', series: [{ id: 'revenue', label: 'Revenue', data: [9] }] },
    ];

    fixture.componentRef.setInput('periods', periods);
    fixture.componentRef.setInput('selectedPeriodId', 'current');
    fixture.detectChanges();

    const selectedPeriod = (fixture.componentInstance as unknown as { selectedPeriod: () => RevenueOverviewPeriod | null }).selectedPeriod();

    expect(selectedPeriod).toBe(periods[1]);
  });

  it('emits typed period selection events', () => {
    const fixture = TestBed.createComponent(RevenueOverviewWidget);
    const period: RevenueOverviewPeriod = { id: 'current', label: 'Current', series: [{ id: 'revenue', label: 'Revenue', data: [9] }] };
    const selections: RevenueOverviewPeriodChangeEvent[] = [];
    const events: unknown[] = [];

    fixture.componentInstance.periodSelected.subscribe((event) => selections.push(event));
    fixture.componentInstance.events$.subscribe((event) => events.push(event));
    fixture.detectChanges();

    (fixture.componentInstance as unknown as { selectPeriod(period: RevenueOverviewPeriod): void }).selectPeriod(period);

    expect(selections).toEqual([{ period }]);
    expect(events).toEqual([{ type: 'period', period }]);
  });

  it('emits typed chart data selection events', () => {
    const fixture = TestBed.createComponent(RevenueOverviewWidget);
    const selections: RevenueOverviewDataSelectEvent[] = [];
    const events: unknown[] = [];
    const chartEvent = { datasetIndex: 0, index: 1 };

    fixture.componentInstance.dataSelected.subscribe((event) => selections.push(event));
    fixture.componentInstance.events$.subscribe((event) => events.push(event));
    fixture.detectChanges();

    (fixture.componentInstance as unknown as { selectChartData(event: unknown): void }).selectChartData(chartEvent);

    expect(selections[0].event).toBe(chartEvent);
    expect(selections[0].period?.id).toBe('last-week');
    expect(events[0]).toEqual({ type: 'data', ...selections[0] });
  });

  it('renders an empty state when no period has series', () => {
    const fixture = TestBed.createComponent(RevenueOverviewWidget);

    fixture.componentRef.setInput('periods', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No revenue data to display.');
  });
});
