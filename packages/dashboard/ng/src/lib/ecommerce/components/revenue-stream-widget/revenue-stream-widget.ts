import { Component, DestroyRef, computed, inject, input, output, type InputSignal, type Signal } from '@angular/core';
import type { ChartData, ChartDataset, ChartOptions } from 'chart.js';

import { $dt } from '@primeuix/themes';
import { ChartModule } from 'primeng/chart';
import { Subject } from 'rxjs';

/**
 * Semantic color tone for revenue stream chart series.
 */
export type RevenueStreamTone = 'primary-400' | 'primary-300' | 'primary-200' | 'cyan' | 'orange' | 'gray';

/**
 * Color scheme used when resolving PrimeNG design tokens for the chart.
 */
export type RevenueStreamColorScheme = 'light' | 'dark';

/**
 * Series rendered as one stacked bar dataset in the revenue stream widget.
 */
export interface RevenueStreamSeries {
  readonly id: string;
  readonly label: string;
  readonly data: readonly number[];
  readonly tone?: RevenueStreamTone;
  readonly backgroundColor?: string;
  readonly borderColor?: string;
  readonly barThickness?: number;
  readonly borderRadius?: number | RevenueStreamBorderRadius;
  readonly borderSkipped?: boolean | 'left' | 'right' | 'top' | 'bottom' | 'start' | 'end' | 'middle';
}

/**
 * Per-corner border radius for Chart.js bar elements.
 */
export interface RevenueStreamBorderRadius {
  readonly topLeft?: number;
  readonly topRight?: number;
  readonly bottomLeft?: number;
  readonly bottomRight?: number;
}

/**
 * Payload emitted when a chart element is selected.
 */
export interface RevenueStreamDataSelectEvent {
  readonly event: unknown;
}

/**
 * Union of events emitted by the revenue stream widget event stream.
 */
export type RevenueStreamWidgetEvent = { readonly type: 'data'; readonly event: unknown };

interface RevenueStreamThemeToken {
  readonly tokenPath: string;
  readonly fallback: string;
}

const DEFAULT_LABELS: readonly string[] = ['Q1', 'Q2', 'Q3', 'Q4'];

const DEFAULT_SERIES: readonly RevenueStreamSeries[] = [
  { id: 'subscriptions', label: 'Subscriptions', tone: 'primary-400', data: [4000, 10000, 15000, 4000], barThickness: 32 },
  { id: 'advertising', label: 'Advertising', tone: 'primary-300', data: [2100, 8400, 2400, 7500], barThickness: 32 },
  {
    id: 'affiliate',
    label: 'Affiliate',
    tone: 'primary-200',
    data: [4100, 5200, 3400, 7400],
    borderRadius: {
      topLeft: 8,
      topRight: 8,
      bottomLeft: 0,
      bottomRight: 0,
    },
    borderSkipped: false,
    barThickness: 32,
  },
];

const TONE_TOKENS: Record<RevenueStreamTone, RevenueStreamThemeToken> = {
  'primary-400': { tokenPath: 'primary.400', fallback: '#60a5fa' },
  'primary-300': { tokenPath: 'primary.300', fallback: '#93c5fd' },
  'primary-200': { tokenPath: 'primary.200', fallback: '#bfdbfe' },
  cyan: { tokenPath: 'cyan.500', fallback: '#06b6d4' },
  orange: { tokenPath: 'orange.500', fallback: '#f97316' },
  gray: { tokenPath: 'gray.500', fallback: '#6b7280' },
};

const TEXT_COLOR_TOKEN: RevenueStreamThemeToken = { tokenPath: 'text.color', fallback: '#334155' };

const TEXT_MUTED_COLOR_TOKEN: RevenueStreamThemeToken = { tokenPath: 'text.muted.color', fallback: '#64748b' };

const CONTENT_BORDER_COLOR_TOKEN: RevenueStreamThemeToken = { tokenPath: 'content.border.color', fallback: '#e2e8f0' };

/**
 * Ecommerce widget that charts stacked revenue streams across series.
 */
@Component({
  standalone: true,
  selector: 'app-revenue-stream-widget',
  imports: [ChartModule],
  templateUrl: './revenue-stream-widget.html',
})
export class RevenueStreamWidget {
  private readonly destroyRef = inject(DestroyRef);
  private readonly eventsSubject = new Subject<RevenueStreamWidgetEvent>();

  /**
   * Widget heading shown above the chart.
   */
  readonly title = input('Revenue Stream');

  /**
   * Labels rendered on the x-axis.
   */
  readonly labels = input<readonly string[]>(DEFAULT_LABELS);

  /**
   * Stacked revenue stream series rendered by the chart.
   */
  readonly series = input<readonly RevenueStreamSeries[]>(DEFAULT_SERIES);

  /**
   * Recompute chart colors when a parent theme token changes.
   */
  readonly themeKey = input<unknown>(null);

  /**
   * Color scheme used when resolving scheme-aware PrimeNG design tokens.
   */
  readonly colorScheme = input<RevenueStreamColorScheme>('light');

  /**
   * Full Chart.js options override. Leave unset to use the widget defaults.
   */
  readonly options: InputSignal<ChartOptions<'bar'> | null> = input<ChartOptions<'bar'> | null>(null);

  /**
   * Tailwind height class passed to PrimeNG Chart.
   */
  readonly chartClass = input('h-80');

  /**
   * Message shown when no series are available.
   */
  readonly emptyMessage = input('No revenue stream data to display.');

  /**
   * Emits when the user selects a chart element.
   */
  readonly dataSelected = output<RevenueStreamDataSelectEvent>();

  /**
   * RxJS stream of all user events emitted by this widget.
   */
  readonly events$ = this.eventsSubject.asObservable();

  protected readonly chartData: Signal<ChartData<'bar'>> = computed<ChartData<'bar'>>(() => {
    this.themeKey();

    return {
      labels: [...this.labels()],
      datasets: this.series().map((series, index) => this.toChartDataset(series, index)),
    };
  });

  protected readonly resolvedChartOptions: Signal<ChartOptions<'bar'>> = computed<ChartOptions<'bar'>>(() => {
    this.themeKey();

    return this.options() ?? this.defaultChartOptions();
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.eventsSubject.complete());
  }

  protected selectChartData(event: unknown): void {
    this.dataSelected.emit({ event });
    this.eventsSubject.next({ type: 'data', event });
  }

  private toChartDataset(series: RevenueStreamSeries, index: number): ChartDataset<'bar'> {
    const backgroundColor = series.backgroundColor ?? this.resolveToneColor(series.tone ?? this.defaultTone(index));

    return {
      label: series.label,
      backgroundColor,
      borderColor: series.borderColor ?? backgroundColor,
      borderRadius: series.borderRadius ?? 0,
      borderSkipped: series.borderSkipped ?? true,
      barThickness: series.barThickness ?? 32,
      data: series.data.map((value) => this.normalizeDataPoint(value)),
    };
  }

  private defaultChartOptions(): ChartOptions<'bar'> {
    const textColor = this.resolveThemeToken(TEXT_COLOR_TOKEN);
    const textMutedColor = this.resolveThemeToken(TEXT_MUTED_COLOR_TOKEN);
    const borderColor = this.resolveThemeToken(CONTENT_BORDER_COLOR_TOKEN);

    return {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        legend: {
          labels: {
            color: textColor,
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          ticks: {
            color: textMutedColor,
          },
          grid: {
            color: 'transparent',
          },
        },
        y: {
          stacked: true,
          ticks: {
            color: textMutedColor,
          },
          grid: {
            color: borderColor,
            drawTicks: false,
          },
        },
      },
    };
  }

  private resolveToneColor(tone: RevenueStreamTone): string {
    return this.resolveThemeToken(TONE_TOKENS[tone]);
  }

  private resolveThemeToken(token: RevenueStreamThemeToken): string {
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

  private isColorSchemeToken(value: unknown): value is Record<RevenueStreamColorScheme, { value?: string }> {
    return typeof value === 'object' && value !== null && ('light' in value || 'dark' in value);
  }

  private defaultTone(index: number): RevenueStreamTone {
    if (index === 0) {
      return 'primary-400';
    }

    if (index === 1) {
      return 'primary-300';
    }

    return 'primary-200';
  }

  private normalizeDataPoint(value: number): number {
    return Number.isFinite(value) ? value : 0;
  }
}
