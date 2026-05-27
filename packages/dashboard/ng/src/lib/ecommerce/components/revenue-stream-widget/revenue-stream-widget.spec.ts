import { TestBed } from '@angular/core/testing';

import { RevenueStreamDataSelectEvent, RevenueStreamSeries, RevenueStreamWidget } from './revenue-stream-widget';

describe(RevenueStreamWidget.name, () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RevenueStreamWidget],
    }).compileComponents();
  });

  it('renders the default revenue stream', () => {
    const fixture = TestBed.createComponent(RevenueStreamWidget);

    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Revenue Stream');
  });

  it('builds chart data from custom labels and series', () => {
    const fixture = TestBed.createComponent(RevenueStreamWidget);
    const series: readonly RevenueStreamSeries[] = [
      { id: 'usage', label: 'Usage', data: [1200, Number.NaN, 2400], backgroundColor: '#123456', barThickness: 20 },
    ];

    fixture.componentRef.setInput('title', 'Stream Mix');
    fixture.componentRef.setInput('labels', ['Jan', 'Feb', 'Mar']);
    fixture.componentRef.setInput('series', series);
    fixture.detectChanges();

    const chartData = (
      fixture.componentInstance as unknown as { chartData: () => { labels?: unknown; datasets: Array<{ data: number[]; barThickness: number }> } }
    ).chartData();

    expect(fixture.nativeElement.textContent).toContain('Stream Mix');
    expect(chartData.labels).toEqual(['Jan', 'Feb', 'Mar']);
    expect(chartData.datasets[0].data).toEqual([1200, 0, 2400]);
    expect(chartData.datasets[0].barThickness).toBe(20);
  });

  it('uses provided Chart.js options when supplied', () => {
    const fixture = TestBed.createComponent(RevenueStreamWidget);
    const options = { maintainAspectRatio: true };

    fixture.componentRef.setInput('options', options);
    fixture.detectChanges();

    const resolvedOptions = (fixture.componentInstance as unknown as { resolvedChartOptions: () => unknown }).resolvedChartOptions();

    expect(resolvedOptions).toBe(options);
  });

  it('emits typed chart data selection events', () => {
    const fixture = TestBed.createComponent(RevenueStreamWidget);
    const selections: RevenueStreamDataSelectEvent[] = [];
    const events: unknown[] = [];
    const chartEvent = { datasetIndex: 1, index: 2 };

    fixture.componentInstance.dataSelected.subscribe((event) => selections.push(event));
    fixture.componentInstance.events$.subscribe((event) => events.push(event));
    fixture.detectChanges();

    (fixture.componentInstance as unknown as { selectChartData(event: unknown): void }).selectChartData(chartEvent);

    expect(selections).toEqual([{ event: chartEvent }]);
    expect(events).toEqual([{ type: 'data', event: chartEvent }]);
  });

  it('renders an empty state when no series are provided', () => {
    const fixture = TestBed.createComponent(RevenueStreamWidget);

    fixture.componentRef.setInput('series', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No revenue stream data to display.');
  });
});
