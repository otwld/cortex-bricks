import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { SliderModule } from 'primeng/slider';
import { Table, TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ToastModule } from 'primeng/toast';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RatingModule } from 'primeng/rating';
import { RippleModule } from 'primeng/ripple';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { TagModule } from 'primeng/tag';
import { Customer, CustomerService, Product, ProductService, Representative } from '@otwld/ng-dashboard/core';

interface ExpandedRows {
  [key: string]: boolean;
}

interface CustomerStatusOption {
  label: string;
  value: string;
}

interface RowGroupMetadata {
  index: number;
  size: number;
}

/**
 * Demonstrates PrimeNG table filtering, frozen columns, row expansion, and grouping.
 */
@Component({
  selector: 'app-table-demo',
  imports: [
    TableModule,
    MultiSelectModule,
    SelectModule,
    InputIconModule,
    TagModule,
    InputTextModule,
    SliderModule,
    ProgressBarModule,
    ToggleButtonModule,
    ToastModule,
    CurrencyPipe,
    DatePipe,
    NgClass,
    FormsModule,
    ButtonModule,
    RatingModule,
    RippleModule,
    IconFieldModule,
  ],
  templateUrl: './tabledemo.html',
  styles: `
    .p-datatable-frozen-tbody {
      font-weight: bold;
    }

    .p-datatable-scrollable .p-frozen-column {
      font-weight: bold;
    }
  `,
  providers: [ConfirmationService, MessageService, CustomerService, ProductService],
})
export class TableDemo implements OnInit {
  protected customers1: Customer[] = [];

  protected customers2: Customer[] = [];

  protected customers3: Customer[] = [];

  protected representatives: Representative[] = [];

  protected statuses: CustomerStatusOption[] = [];

  protected products: Product[] = [];

  protected rowGroupMetadata: Record<string, RowGroupMetadata> = {};

  protected expandedRows: ExpandedRows = {};

  protected activityValues: number[] = [0, 100];

  protected balanceFrozen = false;

  protected loading = true;

  @ViewChild('filter') private filter!: ElementRef<HTMLInputElement>;

  private readonly customerService = inject(CustomerService);

  private readonly productService = inject(ProductService);

  /**
   * Loads customer and product data used by the table demos.
   */
  ngOnInit(): void {
    this.customerService.getCustomersLarge().then((customers) => {
      this.customers1 = customers.map((customer) => ({
        ...customer,
        date: customer.date ? new Date(customer.date).toISOString() : undefined,
      }));
      this.loading = false;
    });
    this.customerService.getCustomersMedium().then((customers) => (this.customers2 = customers));
    this.customerService.getCustomersLarge().then((customers) => (this.customers3 = customers));
    this.productService.getProductsWithOrdersSmall().then((data) => (this.products = data));

    this.representatives = [
      { name: 'Amy Elsner', image: 'amyelsner.png' },
      { name: 'Anna Fali', image: 'annafali.png' },
      { name: 'Asiya Javayant', image: 'asiyajavayant.png' },
      { name: 'Bernardo Dominic', image: 'bernardodominic.png' },
      { name: 'Elwin Sharvill', image: 'elwinsharvill.png' },
      { name: 'Ioni Bowcher', image: 'ionibowcher.png' },
      { name: 'Ivan Magalhaes', image: 'ivanmagalhaes.png' },
      { name: 'Onyama Limba', image: 'onyamalimba.png' },
      { name: 'Stephen Shaw', image: 'stephenshaw.png' },
      { name: 'XuXue Feng', image: 'xuxuefeng.png' },
    ];

    this.statuses = [
      { label: 'Unqualified', value: 'unqualified' },
      { label: 'Qualified', value: 'qualified' },
      { label: 'New', value: 'new' },
      { label: 'Negotiation', value: 'negotiation' },
      { label: 'Renewal', value: 'renewal' },
      { label: 'Proposal', value: 'proposal' },
    ];
  }

  /**
   * Recomputes row group metadata after sorting.
   */
  protected onSort(): void {
    this.updateRowGroupMetaData();
  }

  /**
   * Builds row group metadata for representative grouped rows.
   */
  protected updateRowGroupMetaData(): void {
    this.rowGroupMetadata = {};

    if (this.customers3) {
      for (let i = 0; i < this.customers3.length; i++) {
        const rowData = this.customers3[i];
        const representativeName = rowData?.representative?.name || '';

        if (i === 0) {
          this.rowGroupMetadata[representativeName] = {
            index: 0,
            size: 1,
          };
        } else {
          const previousRowData = this.customers3[i - 1];
          const previousRowGroup = previousRowData?.representative?.name;
          if (representativeName === previousRowGroup) {
            this.rowGroupMetadata[representativeName].size++;
          } else {
            this.rowGroupMetadata[representativeName] = {
              index: i,
              size: 1,
            };
          }
        }
      }
    }
  }

  /**
   * Formats numeric values as US dollars for table cells.
   */
  protected formatCurrency(value: number | undefined): string {
    if (value === undefined) {
      return '';
    }

    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  }

  /**
   * Applies the table global text filter.
   */
  protected onGlobalFilter(table: Table, event: Event): void {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  /**
   * Clears all filters and resets the global filter input.
   */
  protected clear(table: Table): void {
    table.clear();
    this.filter.nativeElement.value = '';
  }

  /**
   * Maps customer, product, and order statuses to PrimeNG tag severities.
   */
  protected getSeverity(status: string | undefined): 'success' | 'warn' | 'danger' | 'info' {
    switch (status) {
      case 'qualified':
      case 'instock':
      case 'INSTOCK':
      case 'DELIVERED':
      case 'delivered':
        return 'success';

      case 'negotiation':
      case 'lowstock':
      case 'LOWSTOCK':
      case 'PENDING':
      case 'pending':
        return 'warn';

      case 'unqualified':
      case 'outofstock':
      case 'OUTOFSTOCK':
      case 'CANCELLED':
      case 'cancelled':
        return 'danger';

      default:
        return 'info';
    }
  }

  /**
   * Counts grouped customers for the specified representative.
   */
  protected calculateCustomerTotal(name: string | undefined): number {
    let total = 0;

    if (this.customers2) {
      for (const customer of this.customers2) {
        if (customer.representative?.name === name) {
          total++;
        }
      }
    }

    return total;
  }

  /**
   * Expands all product order rows.
   */
  protected expandAll(): void {
    this.expandedRows = this.products.reduce(
      (acc, p) => {
        if (p.id) {
          acc[p.id] = true;
        }
        return acc;
      },
      {} as { [key: string]: boolean },
    );
  }

  /**
   * Collapses all product order rows.
   */
  protected collapseAll(): void {
    this.expandedRows = {};
  }
}
