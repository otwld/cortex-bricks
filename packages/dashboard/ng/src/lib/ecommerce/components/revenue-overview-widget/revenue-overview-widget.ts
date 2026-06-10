import { Component, DestroyRef, computed, inject, input, output, signal, type InputSignal, type Signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { ChartData, ChartDataset, ChartOptions } from 'chart.js';

import { $dt } from '@primeuix/themes';
import { ChartModule } from 'primeng/chart';
import { SelectModule } from 'primeng/select';
import { Subject } from 'rxjs';

/**
 * Semantic color tone for revenue overview chart series.
 */
export type RevenueOverviewTone = 'primary' | 'primary-soft' | 'cyan' | 'orange' | 'gray';

/**
 * Color scheme used when resolving PrimeNG design tokens for the chart.
 */
export type RevenueOverviewColorScheme = 'light' | 'dark';

/**
 * Series rendered as one dataset in the revenue overview chart.
 */
export interface RevenueOverviewSeries {
  readonly id: string;
  readonly label: string;
  readonly data: readonly number[];
  readonly tone?: RevenueOverviewTone;
  readonly backgroundColor?: string;
  readonly borderColor?: string;
  readonly barThickness?: number;
  readonly borderRadius?: number;
}

/**
 * Period option selectable from the revenue overview widget.
 */
export interface RevenueOverviewPeriod {
  readonly id: string;
  readonly label: string;
  readonly series: readonly RevenueOverviewSeries[];
}

/**
 * Payload emitted when the selected period changes.
 */
export interface RevenueOverviewPeriodChangeEvent {
  readonly period: RevenueOverviewPeriod;
}

/**
 * Payload emitted when a chart element is selected.
 */
export interface RevenueOverviewDataSelectEvent {
  readonly period: RevenueOverviewPeriod | null;
  readonly event: unknown;
}

/**
 * Union of events emitted by the revenue overview widget event stream.
 */
export type RevenueOverviewWidgetEvent =
  | ({ readonly type: 'period' } & RevenueOverviewPeriodChangeEvent)
  | ({ readonly type: 'data' } & RevenueOverviewDataSelectEvent);

interface RevenueOverviewThemeToken {
  readonly tokenPath: string;
  readonly fallback: string;
}

const DEFAULT_LABELS: readonly string[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const DEFAULT_PERIODS: readonly RevenueOverviewPeriod[] = [
  {
    id: 'last-week',
    label: 'Last Week',
    series: [
      { id: 'revenue', label: 'Revenue', tone: 'primary', data: [65, 59, 80, 81, 56, 55, 40] },
      { id: 'profit', label: 'Profit', tone: 'primary-soft', data: [28, 48, 40, 19, 86, 27, 90] },
    ],
  },
  {
    id: 'this-week',
    label: 'This Week',
    series: [
      { id: 'revenue', label: 'Revenue', tone: 'primary', data: [35, 19, 40, 61, 16, 55, 30] },
      { id: 'profit', label: 'Profit', tone: 'primary-soft', data: [48, 78, 10, 29, 76, 77, 10] },
    ],
  },
];

const TONE_TOKENS: Record<RevenueOverviewTone, RevenueOverviewThemeToken> = {
  primary: { tokenPath: 'primary.500', fallback: '#3b82f6' },
  'primary-soft': { tokenPath: 'primary.200', fallback: '#bfdbfe' },
  cyan: { tokenPath: 'cyan.500', fallback: '#06b6d4' },
  orange: { tokenPath: 'orange.500', fallback: '#f97316' },
  gray: { tokenPath: 'gray.500', fallback: '#6b7280' },
};

const TEXT_COLOR_TOKEN: RevenueOverviewThemeToken = { tokenPath: 'text.color', fallback: '#334155' };

const TEXT_MUTED_COLOR_TOKEN: RevenueOverviewThemeToken = { tokenPath: 'text.muted.color', fallback: '#64748b' };

const CONTENT_BORDER_COLOR_TOKEN: RevenueOverviewThemeToken = { tokenPath: 'content.border.color', fallback: '#e2e8f0' };

/**
 * Ecommerce widget that charts revenue trends and supports period filtering.
 */
@Component({
  selector: 'app-revenue-overview-widget',
  imports: [ChartModule, FormsModule, SelectModule],
  templateUrl: './revenue-overview-widget.html',
})
export class RevenueOverviewWidget {
  private readonly destroyRef = inject(DestroyRef);
  private readonly localSelectedPeriodId = signal<string | null>(null);
  private readonly eventsSubject = new Subject<RevenueOverviewWidgetEvent>();

  /**
   * Widget heading shown above the chart.
   */
  readonly title = input('Revenue Overview');

  /**
   * Labels rendered on the x-axis.
   */
  readonly labels = input<readonly string[]>(DEFAULT_LABELS);

  /**
   * Selectable revenue periods and their chart series.
   */
  readonly periods = input<readonly RevenueOverviewPeriod[]>(DEFAULT_PERIODS);

  /**
   * Optional controlled selected period id. Leave unset for local selection state.
   */
  readonly selectedPeriodId = input<string | null>(null);

  /**
   * Recompute chart colors when a parent theme token changes.
   */
  readonly themeKey = input<unknown>(null);

  /**
   * Color scheme used when resolving scheme-aware PrimeNG design tokens.
   */
  readonly colorScheme = input<RevenueOverviewColorScheme>('light');

  /**
   * Full Chart.js options override. Leave unset to use the widget defaults.
   */
  readonly options: InputSignal<ChartOptions<'bar'> | null> = input<ChartOptions<'bar'> | null>(null);

  /**
   * Tailwind height class passed to PrimeNG Chart.
   */
  readonly chartClass = input('h-[300px]');

  /**
   * Controls whether the period select is rendered.
   */
  readonly showPeriodSelector = input(true);

  /**
   * Controls whether the period select can be changed.
   */
  readonly periodSelectDisabled = input(false);

  /**
   * Accessible label for the period select.
   */
  readonly periodSelectAriaLabel = input('Select revenue period');

  /**
   * Message shown when the selected period has no series.
   */
  readonly emptyMessage = input('No revenue data to display.');

  /**
   * Emits when the user selects a different period.
   */
  readonly periodSelected = output<RevenueOverviewPeriodChangeEvent>();

  /**
   * Emits when the user selects a chart element.
   */
  readonly dataSelected = output<RevenueOverviewDataSelectEvent>();

  /**
   * RxJS stream of all user events emitted by this widget.
   */
  readonly events$ = this.eventsSubject.asObservable();

  protected readonly periodOptions = computed(() => this.periods().filter((period) => period.series.length > 0));

  public readonly selectedPeriod = computed<RevenueOverviewPeriod | null>(() => {
    const periods = this.periodOptions();
    const selectedId = this.selectedPeriodId() ?? this.localSelectedPeriodId();

    return periods.find((period) => period.id === selectedId) ?? periods[0] ?? null;
  });

  public readonly chartData: Signal<ChartData<'bar'>> = computed<ChartData<'bar'>>(() => {
    const period = this.selectedPeriod();
    this.themeKey();

    if (!period) {
      return { labels: [...this.labels()], datasets: [] };
    }

    return {
      labels: [...this.labels()],
      datasets: period.series.map((series, index) => this.toChartDataset(series, index)),
    };
  });

  public readonly resolvedChartOptions: Signal<ChartOptions<'bar'>> = computed<ChartOptions<'bar'>>(() => {
    this.themeKey();

    return this.options() ?? this.defaultChartOptions();
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.eventsSubject.complete());
  }

  public selectPeriod(period: RevenueOverviewPeriod | null | undefined): void {
    if (!period) {
      return;
    }

    this.localSelectedPeriodId.set(period.id);

    const event = { period };
    this.periodSelected.emit(event);
    this.eventsSubject.next({ type: 'period', ...event });
  }

  public selectChartData(event: unknown): void {
    const payload = { period: this.selectedPeriod(), event };

    this.dataSelected.emit(payload);
    this.eventsSubject.next({ type: 'data', ...payload });
  }

  private toChartDataset(series: RevenueOverviewSeries, index: number): ChartDataset<'bar'> {
    const backgroundColor = series.backgroundColor ?? this.resolveToneColor(series.tone ?? this.defaultTone(index));

    return {
      label: series.label,
      backgroundColor,
      borderColor: series.borderColor ?? backgroundColor,
      barThickness: series.barThickness ?? 12,
      borderRadius: series.borderRadius ?? 12,
      data: series.data.map((value) => this.normalizeDataPoint(value)),
    };
  }

  private defaultChartOptions(): ChartOptions<'bar'> {
    const textColor = this.resolveThemeToken(TEXT_COLOR_TOKEN);
    const textColorSecondary = this.resolveThemeToken(TEXT_MUTED_COLOR_TOKEN);
    const surfaceBorder = this.resolveThemeToken(CONTENT_BORDER_COLOR_TOKEN);

    return {
      animation: {
        duration: 0,
      },
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: textColor,
            usePointStyle: true,
            font: {
              weight: 700,
            },
            padding: 28,
          },
          position: 'bottom',
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
            font: {
              weight: 500,
            },
          },
          grid: {
            display: false,
          },
        },
        y: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
          },
        },
      },
    };
  }

  private resolveToneColor(tone: RevenueOverviewTone): string {
    return this.resolveThemeToken(TONE_TOKENS[tone]);
  }

  private resolveThemeToken(token: RevenueOverviewThemeToken): string {
    return this.resolveTokenValue($dt(token.tokenPath).value, token.fallback);
  }

  private resolveTokenValue(value: unknown, fallback: string): string {
    if (typeof value === 'string' && value.trim()) {
      return value;
    }

    if (this.isColorSchemeToken(value)) {
      const schemeValue = value[this.colorScheme()]?.value;

      if (schemeValue) {
        return schemeValue;
      }
    }

    return fallback;
  }

  private isColorSchemeToken(value: unknown): value is Record<RevenueOverviewColorScheme, { value?: string }> {
    return typeof value === 'object' && value !== null && ('light' in value || 'dark' in value);
  }

  private defaultTone(index: number): RevenueOverviewTone {
    return index === 0 ? 'primary' : 'primary-soft';
  }

  private normalizeDataPoint(value: number): number {
    return Number.isFinite(value) ? value : 0;
  }
}
