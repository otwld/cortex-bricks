import { TestBed } from '@angular/core/testing';

import { StatsMetric, StatsMetricSelectEvent, StatsWidget } from './stats-widget';

describe(StatsWidget.name, () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatsWidget],
    }).compileComponents();
  });

  it('renders the default ecommerce metrics', () => {
    const fixture = TestBed.createComponent(StatsWidget);

    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Sales');
    expect(element.textContent).toContain('Revenue');
    expect(element.textContent).toContain('Visitors');
    expect(element.textContent).toContain('Stock');
  });

  it('builds metric view models from custom inputs', () => {
    const fixture = TestBed.createComponent(StatsWidget);
    const metrics: readonly StatsMetric[] = [
      {
        id: 'returns',
        label: 'Returns',
        value: '18',
        changeLabel: '-4%',
        changeDirection: 'down',
        visual: { type: 'sparkline', path: 'M0 0L1 1', viewBox: '0 0 1 1', tone: 'orange' },
      },
      {
        id: 'stock',
        label: 'Stock',
        value: '91',
        changeLabel: '+8%',
        changeDirection: 'up',
        visual: { type: 'knob', value: 120, max: 100 },
      },
    ];

    fixture.componentRef.setInput('metrics', metrics);
    fixture.detectChanges();

    const viewModels = (
      fixture.componentInstance as unknown as {
        metricViewModels: () => Array<{ id: string; changeIcon: string; sparklineClass?: string; knobValue?: number }>;
      }
    ).metricViewModels();

    expect(fixture.nativeElement.textContent).toContain('Returns');
    expect(viewModels[0].id).toBe('returns');
    expect(viewModels[0].changeIcon).toBe('pi pi-arrow-down');
    expect(viewModels[0].sparklineClass).toBe('stroke-orange-500');
    expect(viewModels[1].knobValue).toBe(100);
  });

  it('emits typed metric selection events', () => {
    const fixture = TestBed.createComponent(StatsWidget);
    const selections: StatsMetricSelectEvent[] = [];
    const events: unknown[] = [];

    fixture.componentInstance.metricSelected.subscribe((event) => selections.push(event));
    fixture.componentInstance.events$.subscribe((event) => events.push(event));
    fixture.detectChanges();

    const metric = (
      fixture.componentInstance as unknown as {
        metricViewModels: () => StatsMetric[];
      }
    ).metricViewModels()[0];
    if (!metric) throw new Error('Expected a demo metric view model.');

    (fixture.componentInstance as unknown as { selectMetric(metric: StatsMetric): void }).selectMetric(metric);

    expect(selections).toEqual([{ metric }]);
    expect(events).toEqual([{ type: 'metric', metric }]);
  });
});
