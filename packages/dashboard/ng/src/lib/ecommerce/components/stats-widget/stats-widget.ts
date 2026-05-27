import { Component, DestroyRef, computed, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { KnobModule } from 'primeng/knob';
import { Subject } from 'rxjs';

export type StatsChangeDirection = 'up' | 'down' | 'flat';

export type StatsTone = 'primary' | 'green' | 'pink' | 'cyan' | 'orange' | 'gray';

export interface StatsSparklineVisual {
  readonly type: 'sparkline';
  readonly path: string;
  readonly viewBox: string;
  readonly tone?: StatsTone;
  readonly strokeWidth?: number;
}

export interface StatsKnobVisual {
  readonly type: 'knob';
  readonly value: number;
  readonly valueTemplate?: string;
  readonly size?: number;
  readonly strokeWidth?: number;
  readonly min?: number;
  readonly max?: number;
  readonly ariaLabel?: string;
}

export type StatsMetricVisual = StatsSparklineVisual | StatsKnobVisual;

/**
 * Metric summary rendered by the ecommerce stats widget.
 */
export interface StatsMetric {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly changeLabel: string;
  readonly changeDirection: StatsChangeDirection;
  readonly changeTone?: StatsTone;
  readonly visual: StatsMetricVisual;
}

/**
 * Payload emitted when a metric card is selected.
 */
export interface StatsMetricSelectEvent {
  readonly metric: StatsMetric;
}

export type StatsWidgetEvent = { readonly type: 'metric' } & StatsMetricSelectEvent;

interface StatsMetricViewModel extends StatsMetric {
  readonly changeClass: string;
  readonly changeIcon: string;
  readonly sparklineClass?: string;
  readonly knobValue?: number;
  readonly knobValueTemplate?: string;
  readonly knobSize?: number;
  readonly knobStrokeWidth?: number;
  readonly knobMin?: number;
  readonly knobMax?: number;
  readonly knobAriaLabel?: string;
}

const SALES_SPARKLINE_PATH =
  'M1 93.9506L4.5641 94.3162C8.12821 94.6817 15.2564 95.4128 22.3846 89.6451C29.5128 83.8774 36.641 71.6109 43.7692 64.4063C50.8974 57.2018 58.0256 55.0592 65.1538 58.9268C72.2821 62.7945 79.4103 72.6725 86.5385 73.5441C93.6667 74.4157 100.795 66.2809 107.923 65.9287C115.051 65.5765 122.179 73.0068 129.308 66.8232C136.436 60.6396 143.564 40.8422 150.692 27.9257C157.821 15.0093 164.949 8.97393 172.077 6.43766C179.205 3.9014 186.333 4.86425 193.462 12.0629C200.59 19.2616 207.718 32.696 214.846 31.0487C221.974 29.4014 229.103 12.6723 236.231 5.64525C243.359 -1.38178 250.487 1.29325 254.051 2.63076L257.615 3.96827';

const REVENUE_SPARKLINE_PATH =
  'M1 35.6498L2.24444 32.4319C3.48889 29.214 5.97778 22.7782 8.46667 20.3627C10.9556 17.9473 13.4444 19.5522 15.9333 21.7663C18.4222 23.9803 20.9111 26.8035 23.4 30.6606C25.8889 34.5176 28.3778 39.4085 30.8667 37.2137C33.3556 35.0189 35.8444 25.7383 38.3333 26.3765C40.8222 27.0146 43.3111 37.5714 45.8 38.9013C48.2889 40.2311 50.7778 32.3341 53.2667 31.692C55.7556 31.0499 58.2444 37.6628 60.7333 39.4617C63.2222 41.2607 65.7111 38.2458 68.2 34.9205C70.6889 31.5953 73.1778 27.9597 75.6667 23.5955C78.1556 19.2313 80.6444 14.1385 83.1333 13.8875C85.6222 13.6365 88.1111 18.2272 90.6 20.2425C93.0889 22.2578 95.5778 21.6977 98.0667 18.8159C100.556 15.9341 103.044 10.7306 105.533 7.37432C108.022 4.01806 110.511 2.50903 111.756 1.75451L113 1';

const VISITORS_SPARKLINE_PATH =
  'M1.5 1L2.74444 2.61495C3.98889 4.2299 6.47778 7.4598 8.96667 9.07151C11.4556 10.6832 13.9444 10.6767 16.4333 11.6127C18.9222 12.5487 21.4111 14.4271 23.9 16.6724C26.3889 18.9178 28.8778 21.5301 31.3667 20.1977C33.8556 18.8652 36.3444 13.5878 38.8333 11.3638C41.3222 9.13969 43.8111 9.96891 46.3 11.9894C48.7889 14.0099 51.2778 17.2217 53.7667 16.2045C56.2556 15.1873 58.7444 9.9412 61.2333 11.2783C63.7222 12.6155 66.2111 20.5359 68.7 21.4684C71.1889 22.401 73.6778 16.3458 76.1667 16.0009C78.6556 15.6561 81.1444 21.0217 83.6333 24.2684C86.1222 27.515 88.6111 28.6428 91.1 27.4369C93.5889 26.2311 96.0778 22.6916 98.5667 22.7117C101.056 22.7317 103.544 26.3112 106.033 29.7859C108.522 33.2605 111.011 36.6302 112.256 38.3151L113.5 40';

const DEFAULT_METRICS: readonly StatsMetric[] = [
  {
    id: 'sales',
    label: 'Sales',
    value: '120',
    changeLabel: '+12%',
    changeDirection: 'up',
    changeTone: 'green',
    visual: { type: 'sparkline', path: SALES_SPARKLINE_PATH, viewBox: '0 0 258 96', tone: 'primary', strokeWidth: 2 },
  },
  {
    id: 'revenue',
    label: 'Revenue',
    value: '$4500',
    changeLabel: '+20%',
    changeDirection: 'up',
    changeTone: 'green',
    visual: { type: 'sparkline', path: REVENUE_SPARKLINE_PATH, viewBox: '0 0 115 41', tone: 'primary', strokeWidth: 1 },
  },
  {
    id: 'visitors',
    label: 'Visitors',
    value: '360',
    changeLabel: '+24%',
    changeDirection: 'down',
    changeTone: 'pink',
    visual: { type: 'sparkline', path: VISITORS_SPARKLINE_PATH, viewBox: '0 0 115 41', tone: 'pink', strokeWidth: 1 },
  },
  {
    id: 'stock',
    label: 'Stock',
    value: '164',
    changeLabel: '+30%',
    changeDirection: 'up',
    changeTone: 'green',
    visual: { type: 'knob', value: 80, valueTemplate: '90%', size: 90, strokeWidth: 2, ariaLabel: 'Stock availability' },
  },
];

const TONE_TEXT_CLASSES: Record<StatsTone, string> = {
  primary: 'text-primary',
  green: 'text-green-500',
  pink: 'text-pink-500',
  cyan: 'text-cyan-500',
  orange: 'text-orange-500',
  gray: 'text-muted-color',
};

const SPARKLINE_STROKE_CLASSES: Record<StatsTone, string> = {
  primary: 'stroke-primary',
  green: 'stroke-green-500',
  pink: 'stroke-pink-500',
  cyan: 'stroke-cyan-500',
  orange: 'stroke-orange-500',
  gray: 'stroke-surface-500',
};

const CHANGE_ICONS: Record<StatsChangeDirection, string> = {
  up: 'pi pi-arrow-up',
  down: 'pi pi-arrow-down',
  flat: 'pi pi-minus',
};

@Component({
  standalone: true,
  selector: 'app-stats-widget',
  imports: [ButtonModule, KnobModule, FormsModule],
  templateUrl: './stats-widget.html',
  host: {
    '[style.display]': '"contents"',
  },
})
export class StatsWidget {
  private readonly destroyRef = inject(DestroyRef);
  private readonly eventsSubject = new Subject<StatsWidgetEvent>();

  /**
   * Metric cards rendered by the widget.
   */
  readonly metrics = input<readonly StatsMetric[]>(DEFAULT_METRICS);

  /**
   * Controls whether per-metric action buttons are rendered.
   */
  readonly showMetricActions = input(false);

  /**
   * Emits when a metric card is selected.
   */
  readonly metricSelected = output<StatsMetricSelectEvent>();

  /**
   * RxJS stream of all user events emitted by this widget.
   */
  readonly events$ = this.eventsSubject.asObservable();

  protected readonly metricViewModels = computed(() => this.metrics().map((metric) => this.toMetricViewModel(metric)));

  constructor() {
    this.destroyRef.onDestroy(() => this.eventsSubject.complete());
  }

  protected selectMetric(metric: StatsMetric): void {
    const event = { metric };

    this.metricSelected.emit(event);
    this.eventsSubject.next({ type: 'metric', ...event });
  }

  private toMetricViewModel(metric: StatsMetric): StatsMetricViewModel {
    const changeTone = metric.changeTone ?? (metric.changeDirection === 'down' ? 'pink' : 'green');
    const sparklineClass = metric.visual.type === 'sparkline' ? SPARKLINE_STROKE_CLASSES[metric.visual.tone ?? 'primary'] : undefined;

    return {
      ...metric,
      changeClass: TONE_TEXT_CLASSES[changeTone],
      changeIcon: CHANGE_ICONS[metric.changeDirection],
      sparklineClass,
      knobValue: metric.visual.type === 'knob' ? this.clampNumber(metric.visual.value, metric.visual.min ?? 0, metric.visual.max ?? 100) : undefined,
      knobValueTemplate: metric.visual.type === 'knob' ? (metric.visual.valueTemplate ?? '{value}%') : undefined,
      knobSize: metric.visual.type === 'knob' ? (metric.visual.size ?? 90) : undefined,
      knobStrokeWidth: metric.visual.type === 'knob' ? (metric.visual.strokeWidth ?? 2) : undefined,
      knobMin: metric.visual.type === 'knob' ? (metric.visual.min ?? 0) : undefined,
      knobMax: metric.visual.type === 'knob' ? (metric.visual.max ?? 100) : undefined,
      knobAriaLabel: metric.visual.type === 'knob' ? (metric.visual.ariaLabel ?? metric.label) : undefined,
    };
  }

  private clampNumber(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) {
      return min;
    }

    return Math.min(max, Math.max(min, value));
  }
}
