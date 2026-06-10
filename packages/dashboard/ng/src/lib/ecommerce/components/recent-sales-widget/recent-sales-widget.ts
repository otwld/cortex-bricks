import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, input, output, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

/**
 * Supported table cell renderer type for recent sales columns.
 */
export type RecentSaleColumnType = 'text' | 'currency' | 'status';

/**
 * PrimeNG tag severity used for recent-sale inventory status.
 */
export type RecentSaleStatusSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

/**
 * Sale row rendered by the recent sales widget.
 */
export interface RecentSale {
  readonly [field: string]: unknown;
  readonly id: string;
  readonly code?: string;
  readonly name: string;
  readonly category: string;
  readonly price: number;
  readonly status: string;
}

/**
 * Dynamic table column configuration for recent sales.
 */
export interface RecentSaleColumn {
  readonly field: keyof RecentSale | string;
  readonly header: string;
  readonly type?: RecentSaleColumnType;
  readonly sortable?: boolean;
  readonly exportHeader?: string;
  readonly minWidthClass?: string;
}

/**
 * Payload emitted when a sale row is selected from the table.
 */
export interface RecentSaleSelectionEvent {
  readonly sale: RecentSale;
}

/**
 * Payload emitted when the export button is selected.
 */
export interface RecentSalesExportEvent {
  readonly rows: readonly RecentSale[];
  readonly columns: readonly RecentSaleColumn[];
}

/**
 * Union of events emitted by the recent sales widget event stream.
 */
export type RecentSalesWidgetEvent =
  | ({ readonly type: 'export' } & RecentSalesExportEvent)
  | { readonly type: 'search'; readonly query: string }
  | ({ readonly type: 'select' } & RecentSaleSelectionEvent);

interface RecentSaleViewModel extends RecentSale {
  readonly source: RecentSale;
  readonly values: Readonly<Record<string, string | number>>;
  readonly statusLabel: string;
  readonly statusSeverity: RecentSaleStatusSeverity;
}

interface RecentSaleColumnViewModel extends RecentSaleColumn {
  readonly field: string;
  readonly type: RecentSaleColumnType;
  readonly sortable: boolean;
  readonly customExportHeader: string;
  readonly minWidthClass: string;
}

const DEFAULT_SALES: readonly RecentSale[] = [
  { id: '1000', code: 'f230fh0g3', name: 'Bamboo Watch', category: 'Accessories', price: 65, status: 'INSTOCK' },
  { id: '1001', code: 'nvklal433', name: 'Black Watch', category: 'Accessories', price: 72, status: 'INSTOCK' },
  { id: '1002', code: 'zz21cz3c1', name: 'Blue Band', category: 'Fitness', price: 79, status: 'LOWSTOCK' },
  { id: '1003', code: '244wgerg2', name: 'Blue T-Shirt', category: 'Clothing', price: 29, status: 'INSTOCK' },
  { id: '1004', code: 'h456wer53', name: 'Bracelet', category: 'Accessories', price: 15, status: 'INSTOCK' },
  { id: '1005', code: 'av2231fwg', name: 'Brown Purse', category: 'Accessories', price: 120, status: 'OUTOFSTOCK' },
  { id: '1006', code: 'bib36pfvm', name: 'Chakra Bracelet', category: 'Accessories', price: 32, status: 'LOWSTOCK' },
];

const DEFAULT_COLUMNS: readonly RecentSaleColumn[] = [
  { field: 'name', header: 'Name', sortable: true, minWidthClass: 'min-w-28' },
  { field: 'category', header: 'Category', sortable: true, minWidthClass: 'min-w-28' },
  { field: 'price', header: 'Price', type: 'currency', sortable: true, minWidthClass: 'min-w-32' },
  { field: 'status', header: 'Status', type: 'status', sortable: true, exportHeader: 'Inventory Status', minWidthClass: 'min-w-32' },
];

/**
 * Ecommerce widget with searchable, pageable recent-sales table data.
 */
@Component({
  selector: 'app-recent-sales-widget',
  imports: [ButtonModule, CurrencyPipe, IconFieldModule, InputIconModule, InputTextModule, TableModule, TagModule, TooltipModule],
  templateUrl: './recent-sales-widget.html',
})
export class RecentSalesWidget {
  private readonly salesTable = viewChild<Table>('salesTable');
  private readonly filterRequests = new Subject<string>();
  private readonly eventsSubject = new Subject<RecentSalesWidgetEvent>();
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Widget heading shown above the sales table.
   */
  readonly title = input('Recent Sales');

  /**
   * Sale rows displayed by the table.
   */
  readonly sales = input<readonly RecentSale[]>(DEFAULT_SALES);

  /**
   * Dynamic table columns. Supported column types are text, currency and status.
   */
  readonly columns = input<readonly RecentSaleColumn[]>(DEFAULT_COLUMNS);

  /**
   * Number of rows shown per page when pagination is enabled.
   */
  readonly rows = input(5);

  /**
   * Enables PrimeNG table pagination.
   */
  readonly paginator = input(true);

  /**
   * CSS width passed to PrimeNG tableStyle for horizontal scrolling.
   */
  readonly tableMinWidth = input('44rem');

  /**
   * Fields used by PrimeNG's global table filter.
   */
  readonly globalFilterFields = input<readonly string[]>(['name', 'category', 'price', 'status']);

  /**
   * Currency code used by currency columns.
   */
  readonly currencyCode = input('USD');

  /**
   * Controls whether the search box is rendered.
   */
  readonly showSearch = input(true);

  /**
   * Controls whether the export button is rendered.
   */
  readonly showExport = input(true);

  /**
   * Controls whether row view buttons are rendered.
   */
  readonly showViewAction = input(true);

  /**
   * Placeholder text for the global search input.
   */
  readonly searchPlaceholder = input('Search');

  /**
   * Accessible label for the global search input.
   */
  readonly searchAriaLabel = input('Search recent sales');

  /**
   * Tooltip text for the export button.
   */
  readonly exportTooltip = input('Export');

  /**
   * Accessible label for the export button.
   */
  readonly exportAriaLabel = input('Export recent sales');

  /**
   * Header text for the optional row action column.
   */
  readonly viewHeader = input('View');

  /**
   * Message shown when no sales are available.
   */
  readonly emptyMessage = input('No recent sales to display.');

  /**
   * Emits when a sale row is selected.
   */
  readonly saleSelected = output<RecentSaleSelectionEvent>();

  /**
   * Emits after the export button is selected.
   */
  readonly salesExported = output<RecentSalesExportEvent>();

  /**
   * RxJS stream of all user events emitted by this widget.
   */
  readonly events$ = this.eventsSubject.asObservable();

  protected readonly columnViewModels = computed<RecentSaleColumnViewModel[]>(() => this.columns().map((column) => this.toColumnViewModel(column)));

  protected readonly saleViewModels = computed<RecentSaleViewModel[]>(() => this.sales().map((sale) => this.toSaleViewModel(sale)));

  protected readonly emptyStateColumnSpan = computed(() => this.columnViewModels().length + (this.showViewAction() ? 1 : 0));

  protected readonly tableGlobalFilterFields = computed(() => [...this.globalFilterFields()]);

  protected readonly tableStyle = computed(() => ({ 'min-width': this.tableMinWidth() }));

  constructor() {
    this.filterRequests.pipe(debounceTime(120), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe((query) => {
      this.salesTable()?.filterGlobal(query, 'contains');
      this.eventsSubject.next({ type: 'search', query });
    });

    this.destroyRef.onDestroy(() => this.eventsSubject.complete());
  }

  protected queueGlobalFilter(event: Event): void {
    const target = event.target as HTMLInputElement | null;

    this.filterRequests.next(target?.value ?? '');
  }

  protected exportSales(): void {
    this.salesTable()?.exportCSV();

    const event = { rows: this.sales(), columns: this.columns() };
    this.salesExported.emit(event);
    this.eventsSubject.next({ type: 'export', ...event });
  }

  protected selectSale(sale: RecentSaleViewModel): void {
    const event = { sale: sale.source };

    this.saleSelected.emit(event);
    this.eventsSubject.next({ type: 'select', ...event });
  }

  protected viewAriaLabel(sale: RecentSaleViewModel): string {
    return `View ${sale.name}`;
  }

  private toColumnViewModel(column: RecentSaleColumn): RecentSaleColumnViewModel {
    const field = String(column.field);

    return {
      ...column,
      field,
      type: column.type ?? 'text',
      sortable: column.sortable ?? false,
      customExportHeader: column.exportHeader ?? column.header,
      minWidthClass: column.minWidthClass ?? 'min-w-28',
    };
  }

  private toSaleViewModel(sale: RecentSale): RecentSaleViewModel {
    const values = this.columnViewModels().reduce<Record<string, string | number>>((cells, column) => {
      cells[column.field] = this.normalizeCellValue(sale, column.field);
      return cells;
    }, {});

    return {
      ...sale,
      source: sale,
      values,
      statusLabel: sale.status,
      statusSeverity: this.getStatusSeverity(sale.status),
    };
  }

  private normalizeCellValue(sale: RecentSale, field: string): string | number {
    const value = sale[field as keyof RecentSale];

    if (typeof value === 'number' || typeof value === 'string') {
      return value;
    }

    return '';
  }

  private getStatusSeverity(status: string): RecentSaleStatusSeverity {
    switch (status.toLowerCase()) {
      case 'instock':
        return 'success';
      case 'lowstock':
        return 'warn';
      case 'outofstock':
        return 'danger';
      default:
        return 'info';
    }
  }
}
