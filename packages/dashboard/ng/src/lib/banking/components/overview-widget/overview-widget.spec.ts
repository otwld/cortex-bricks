import { TestBed } from '@angular/core/testing';

import { BankingOverviewDataSelectEvent, BankingOverviewSeries, OverviewWidget } from './overview-widget';

describe(OverviewWidget.name, () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverviewWidget],
    }).compileComponents();
  });

  it('renders the default banking overview', () => {
    const fixture = TestBed.createComponent(OverviewWidget);

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Overview');
  });

  it('builds chart data from custom labels and series', () => {
    const fixture = TestBed.createComponent(OverviewWidget);
    const series: readonly BankingOverviewSeries[] = [{ id: 'cash', label: 'Cash', data: [10, Number.NaN, 30], borderColor: '#123456' }];

    fixture.componentRef.setInput('title', 'Cash Flow');
    fixture.componentRef.setInput('labels', ['Jan', 'Feb', 'Mar']);
    fixture.componentRef.setInput('series', series);
    fixture.detectChanges();

    const chartData = fixture.componentInstance.chartData();

    expect(fixture.nativeElement.textContent).toContain('Cash Flow');
    expect(chartData.labels).toEqual(['Jan', 'Feb', 'Mar']);
    expect(chartData.datasets[0].data).toEqual([10, 0, 30]);
    expect(chartData.datasets[0].borderColor).toBe('#123456');
  });

  it('uses provided Chart.js options when supplied', () => {
    const fixture = TestBed.createComponent(OverviewWidget);
    const options = { maintainAspectRatio: true };

    fixture.componentRef.setInput('options', options);
    fixture.detectChanges();

    const resolvedOptions = fixture.componentInstance.resolvedChartOptions();

    expect(resolvedOptions).toBe(options);
  });

  it('emits typed chart selection events', () => {
    const fixture = TestBed.createComponent(OverviewWidget);
    const selections: BankingOverviewDataSelectEvent[] = [];
    const events: unknown[] = [];
    const chartEvent = { datasetIndex: 0, index: 1 };

    fixture.componentInstance.dataSelected.subscribe((event) => selections.push(event));
    fixture.componentInstance.events$.subscribe((event) => events.push(event));
    fixture.detectChanges();

    fixture.componentInstance.selectChartData(chartEvent);

    expect(selections).toEqual([{ event: chartEvent }]);
    expect(events).toEqual([{ type: 'data', event: chartEvent }]);
  });

  it('renders an empty state when no series are provided', () => {
    const fixture = TestBed.createComponent(OverviewWidget);

    fixture.componentRef.setInput('series', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No overview data to display.');
  });
});
