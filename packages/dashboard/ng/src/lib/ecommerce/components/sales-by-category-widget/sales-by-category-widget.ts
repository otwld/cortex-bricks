import { Component, DestroyRef, computed, inject, input, output, type InputSignal, type Signal } from '@angular/core';
import type { ChartData, ChartDataset, ChartOptions } from 'chart.js';

import { $dt } from '@primeuix/themes';
import { ChartModule } from 'primeng/chart';
import { Subject } from 'rxjs';

/**
 * Semantic color tone for sales-by-category chart slices.
 */
export type SalesByCategoryTone = 'primary-700' | 'primary-400' | 'primary-100' | 'cyan' | 'orange' | 'gray';

/**
 * Color scheme used when resolving PrimeNG design tokens for the chart.
 */
export type SalesByCategoryColorScheme = 'light' | 'dark';

/**
 * Category slice rendered by the sales-by-category chart.
 */
export interface SalesByCategoryItem {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly tone?: SalesByCategoryTone;
  readonly backgroundColor?: string;
  readonly hoverBackgroundColor?: string;
}

/**
 * Payload emitted when a chart slice is selected.
 */
export interface SalesByCategoryDataSelectEvent {
  readonly event: unknown;
  readonly category: SalesByCategoryItem | null;
}

/**
 * Union of events emitted by the sales-by-category widget event stream.
 */
export type SalesByCategoryWidgetEvent = { readonly type: 'data' } & SalesByCategoryDataSelectEvent;

interface SalesByCategoryThemeToken {
  readonly tokenPath: string;
  readonly fallback: string;
}

const DEFAULT_CATEGORIES: readonly SalesByCategoryItem[] = [
  { id: 'electronics', label: 'Electronics', value: 300, tone: 'primary-700' },
  { id: 'fashion', label: 'Fashion', value: 50, tone: 'primary-400' },
  { id: 'household', label: 'Household', value: 100, tone: 'primary-100' },
];

const TONE_TOKENS: Record<SalesByCategoryTone, SalesByCategoryThemeToken> = {
  'primary-700': { tokenPath: 'primary.700', fallback: '#1d4ed8' },
  'primary-400': { tokenPath: 'primary.400', fallback: '#60a5fa' },
  'primary-100': { tokenPath: 'primary.100', fallback: '#dbeafe' },
  cyan: { tokenPath: 'cyan.500', fallback: '#06b6d4' },
  orange: { tokenPath: 'orange.500', fallback: '#f97316' },
  gray: { tokenPath: 'gray.500', fallback: '#6b7280' },
};

const HOVER_TONE_TOKENS: Record<SalesByCategoryTone, SalesByCategoryThemeToken> = {
  'primary-700': { tokenPath: 'primary.600', fallback: '#2563eb' },
  'primary-400': { tokenPath: 'primary.300', fallback: '#93c5fd' },
  'primary-100': { tokenPath: 'primary.200', fallback: '#bfdbfe' },
  cyan: { tokenPath: 'cyan.400', fallback: '#22d3ee' },
  orange: { tokenPath: 'orange.400', fallback: '#fb923c' },
  gray: { tokenPath: 'gray.400', fallback: '#9ca3af' },
};

const TEXT_COLOR_TOKEN: SalesByCategoryThemeToken = { tokenPath: 'text.color', fallback: '#334155' };

/**
 * Ecommerce widget that renders a pie chart of sales by category.
 */
@Component({
  selector: 'app-sales-by-category-widget',
  imports: [ChartModule],
  templateUrl: './sales-by-category-widget.html',
})
export class SalesByCategoryWidget {
  private readonly destroyRef = inject(DestroyRef);
  private readonly eventsSubject = new Subject<SalesByCategoryWidgetEvent>();

  /**
   * Widget heading shown above the chart.
   */
  readonly title = input('Sales by Category');

  /**
   * Category slices rendered by the chart.
   */
  readonly categories = input<readonly SalesByCategoryItem[]>(DEFAULT_CATEGORIES);

  /**
   * Recompute chart colors when a parent theme token changes.
   */
  readonly themeKey = input<unknown>(null);

  /**
   * Color scheme used when resolving scheme-aware PrimeNG design tokens.
   */
  readonly colorScheme = input<SalesByCategoryColorScheme>('light');

  /**
   * Full Chart.js options override. Leave unset to use the widget defaults.
   */
  readonly options: InputSignal<ChartOptions<'pie'> | null> = input<ChartOptions<'pie'> | null>(null);

  /**
   * Tailwind height class passed to PrimeNG Chart.
   */
  readonly chartClass = input('h-[300px]');

  /**
   * Message shown when no categories are available.
   */
  readonly emptyMessage = input('No category sales to display.');

  /**
   * Emits when the user selects a chart slice.
   */
  readonly dataSelected = output<SalesByCategoryDataSelectEvent>();

  /**
   * RxJS stream of all user events emitted by this widget.
   */
  readonly events$ = this.eventsSubject.asObservable();

  protected readonly chartData: Signal<ChartData<'pie'>> = computed<ChartData<'pie'>>(() => {
    const categories = this.categories();
    this.themeKey();

    if (!categories.length) {
      return { labels: [], datasets: [] };
    }

    return {
      labels: categories.map((category) => category.label),
      datasets: [this.toChartDataset(categories)],
    };
  });

  protected readonly resolvedChartOptions: Signal<ChartOptions<'pie'>> = computed<ChartOptions<'pie'>>(() => {
    this.themeKey();

    return this.options() ?? this.defaultChartOptions();
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.eventsSubject.complete());
  }

  protected selectChartData(event: unknown): void {
    const payload = {
      event,
      category: this.getSelectedCategory(event),
    };

    this.dataSelected.emit(payload);
    this.eventsSubject.next({ type: 'data', ...payload });
  }

  private toChartDataset(categories: readonly SalesByCategoryItem[]): ChartDataset<'pie'> {
    return {
      data: categories.map((category) => this.normalizeDataPoint(category.value)),
      backgroundColor: categories.map((category, index) => category.backgroundColor ?? this.resolveToneColor(category.tone ?? this.defaultTone(index))),
      hoverBackgroundColor: categories.map(
        (category, index) => category.hoverBackgroundColor ?? this.resolveHoverToneColor(category.tone ?? this.defaultTone(index)),
      ),
    };
  }

  private defaultChartOptions(): ChartOptions<'pie'> {
    const textColor = this.resolveThemeToken(TEXT_COLOR_TOKEN);

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
    };
  }

  private resolveToneColor(tone: SalesByCategoryTone): string {
    return this.resolveThemeToken(TONE_TOKENS[tone]);
  }

  private resolveHoverToneColor(tone: SalesByCategoryTone): string {
    return this.resolveThemeToken(HOVER_TONE_TOKENS[tone]);
  }

  private resolveThemeToken(token: SalesByCategoryThemeToken): string {
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

  private isColorSchemeToken(value: unknown): value is Record<SalesByCategoryColorScheme, { value?: string }> {
    return typeof value === 'object' && value !== null && ('light' in value || 'dark' in value);
  }

  private defaultTone(index: number): SalesByCategoryTone {
    return DEFAULT_CATEGORIES[index % DEFAULT_CATEGORIES.length]?.tone ?? 'primary-700';
  }

  private normalizeDataPoint(value: number): number {
    return Number.isFinite(value) ? value : 0;
  }

  private getSelectedCategory(event: unknown): SalesByCategoryItem | null {
    const index = this.readSelectedIndex(event);

    if (index === null) {
      return null;
    }

    return this.categories()[index] ?? null;
  }

  private readSelectedIndex(event: unknown): number | null {
    if (!this.isRecord(event)) {
      return null;
    }

    const explicitIndex = this.toInteger(event['index']);

    if (explicitIndex !== null) {
      return explicitIndex;
    }

    const elementIndex = this.readNestedIndex(event['element']);

    if (elementIndex !== null) {
      return elementIndex;
    }

    if (Array.isArray(event['elements'])) {
      return this.readNestedIndex(event['elements'][0]);
    }

    return null;
  }

  private readNestedIndex(value: unknown): number | null {
    return this.isRecord(value) ? this.toInteger(value['index']) : null;
  }

  private toInteger(value: unknown): number | null {
    return typeof value === 'number' && Number.isInteger(value) ? value : null;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
