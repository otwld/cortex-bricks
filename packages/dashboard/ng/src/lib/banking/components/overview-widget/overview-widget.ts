import { Component, DestroyRef, computed, inject, input, output, type InputSignal, type Signal } from '@angular/core';
import type { ChartData, ChartDataset, ChartOptions, TooltipItem } from 'chart.js';

import { $dt } from '@primeuix/themes';
import { ChartModule } from 'primeng/chart';
import { Subject } from 'rxjs';

/**
 * Semantic color tone for banking overview chart series.
 */
export type BankingOverviewTone = 'green' | 'primary' | 'cyan' | 'orange' | 'gray';

/**
 * Color scheme used when resolving PrimeNG design tokens for the chart.
 */
export type BankingOverviewColorScheme = 'light' | 'dark';

/**
 * Series rendered by the banking overview chart.
 */
export interface BankingOverviewSeries {
  readonly id: string;
  readonly label: string;
  readonly data: readonly number[];
  readonly tone?: BankingOverviewTone;
  readonly fill?: boolean;
  readonly tension?: number;
  readonly borderColor?: string;
  readonly backgroundColor?: string;
}

/**
 * Payload emitted when a chart element is selected.
 */
export interface BankingOverviewDataSelectEvent {
  readonly event: unknown;
}

/**
 * Union of events emitted by the banking overview widget event stream.
 */
export type BankingOverviewWidgetEvent = { readonly type: 'data' } & BankingOverviewDataSelectEvent;

interface BankingOverviewThemeToken {
  readonly tokenPath: string;
  readonly fallback: string;
}

const DEFAULT_LABELS: readonly string[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];

const DEFAULT_SERIES: readonly BankingOverviewSeries[] = [
  { id: 'income', label: 'Income', data: [6500, 5900, 8000, 8100, 5600, 5500, 4000], fill: false, tension: 0.4, tone: 'green' },
  {
    id: 'expenses',
    label: 'Expenses',
    data: [1200, 5100, 6200, 3300, 2100, 6200, 4500],
    fill: true,
    tension: 0.4,
    tone: 'primary',
    backgroundColor: 'rgba(99,102,220,0.2)',
  },
];

const TONE_TOKENS: Record<BankingOverviewTone, BankingOverviewThemeToken> = {
  green: { tokenPath: 'green.500', fallback: '#22c55e' },
  primary: { tokenPath: 'primary.500', fallback: '#6366f1' },
  cyan: { tokenPath: 'cyan.500', fallback: '#06b6d4' },
  orange: { tokenPath: 'orange.500', fallback: '#f97316' },
  gray: { tokenPath: 'gray.500', fallback: '#6b7280' },
};

const TEXT_COLOR_TOKEN: BankingOverviewThemeToken = { tokenPath: 'text.color', fallback: '#334155' };

const TEXT_MUTED_COLOR_TOKEN: BankingOverviewThemeToken = { tokenPath: 'text.muted.color', fallback: '#64748b' };

const CONTENT_BORDER_COLOR_TOKEN: BankingOverviewThemeToken = { tokenPath: 'content.border.color', fallback: '#e2e8f0' };

/**
 * Banking dashboard line-chart widget for income and expense overview data.
 */
@Component({
  standalone: true,
  selector: 'app-overview-widget',
  imports: [ChartModule],
  templateUrl: './overview-widget.html',
})
export class OverviewWidget {
  private readonly destroyRef = inject(DestroyRef);
  private readonly eventsSubject = new Subject<BankingOverviewWidgetEvent>();

  /**
   * Widget heading shown above the chart.
   */
  readonly title = input('Overview');

  /**
   * Labels rendered on the x-axis.
   */
  readonly labels = input<readonly string[]>(DEFAULT_LABELS);

  /**
   * Line series rendered by the chart.
   */
  readonly series = input<readonly BankingOverviewSeries[]>(DEFAULT_SERIES);

  /**
   * Recompute chart colors when a parent theme token changes.
   */
  readonly themeKey = input<unknown>(null);

  /**
   * Color scheme used when resolving scheme-aware PrimeNG design tokens.
   */
  readonly colorScheme = input<BankingOverviewColorScheme>('light');

  /**
   * Full Chart.js options override. Leave unset to use the widget defaults.
   */
  readonly options: InputSignal<ChartOptions<'line'> | null> = input<ChartOptions<'line'> | null>(null);

  /**
   * Tailwind height class passed to PrimeNG Chart.
   */
  readonly chartClass = input('h-80');

  /**
   * Currency code used by the default tooltip formatter.
   */
  readonly currencyCode = input('USD');

  /**
   * Locale used by the default tooltip formatter.
   */
  readonly locale = input('en-US');

  /**
   * Message shown when no overview series are available.
   */
  readonly emptyMessage = input('No overview data to display.');

  /**
   * Emits when the user selects a chart element.
   */
  readonly dataSelected = output<BankingOverviewDataSelectEvent>();

  /**
   * RxJS stream of all user events emitted by this widget.
   */
  readonly events$ = this.eventsSubject.asObservable();

  public readonly chartData: Signal<ChartData<'line'>> = computed<ChartData<'line'>>(() => {
    this.themeKey();

    return {
      labels: [...this.labels()],
      datasets: this.series().map((series, index) => this.toChartDataset(series, index)),
    };
  });

  public readonly resolvedChartOptions: Signal<ChartOptions<'line'>> = computed<ChartOptions<'line'>>(() => {
    this.themeKey();

    return this.options() ?? this.defaultChartOptions();
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.eventsSubject.complete());
  }

  public selectChartData(event: unknown): void {
    const payload = { event };

    this.dataSelected.emit(payload);
    this.eventsSubject.next({ type: 'data', ...payload });
  }

  private toChartDataset(series: BankingOverviewSeries, index: number): ChartDataset<'line'> {
    const borderColor = series.borderColor ?? this.resolveToneColor(series.tone ?? this.defaultTone(index));

    return {
      label: series.label,
      data: series.data.map((value) => this.normalizeDataPoint(value)),
      fill: series.fill ?? false,
      tension: series.tension ?? 0.4,
      borderColor,
      backgroundColor: series.backgroundColor,
    };
  }

  private defaultChartOptions(): ChartOptions<'line'> {
    const textColor = this.resolveThemeToken(TEXT_COLOR_TOKEN);
    const textColorSecondary = this.resolveThemeToken(TEXT_MUTED_COLOR_TOKEN);
    const surfaceBorder = this.resolveThemeToken(CONTENT_BORDER_COLOR_TOKEN);

    return {
      maintainAspectRatio: false,
      aspectRatio: 0.65,
      animation: {
        duration: 0,
      },
      plugins: {
        legend: {
          labels: {
            color: textColor,
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => this.formatTooltipLabel(context),
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
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

  private formatTooltipLabel(context: TooltipItem<'line'>): string {
    const label = context.dataset.label ? `${context.dataset.label}: ` : '';
    const value = typeof context.parsed.y === 'number' ? context.parsed.y : 0;

    return `${label}${new Intl.NumberFormat(this.locale(), { style: 'currency', currency: this.currencyCode() }).format(value)}`;
  }

  private resolveToneColor(tone: BankingOverviewTone): string {
    return this.resolveThemeToken(TONE_TOKENS[tone]);
  }

  private resolveThemeToken(token: BankingOverviewThemeToken): string {
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

  private isColorSchemeToken(value: unknown): value is Record<BankingOverviewColorScheme, { value?: string }> {
    return typeof value === 'object' && value !== null && ('light' in value || 'dark' in value);
  }

  private defaultTone(index: number): BankingOverviewTone {
    return index === 0 ? 'green' : 'primary';
  }

  private normalizeDataPoint(value: number): number {
    return Number.isFinite(value) ? value : 0;
  }
}
