import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Product, ProductService } from '@otwld/ng-dashboard/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { RatingModule } from 'primeng/rating';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';

/** Column definition for the products table. */
interface Column {
  field: string;
  header: string;
  customExportHeader?: string;
}

/** Export column definition for CSV export. */
interface ExportColumn {
  title: string;
  dataKey: string;
}

/** CRUD product management page with table, dialog editor, and CSV export. */
@Component({
  selector: 'app-crud-page',
  imports: [
    CurrencyPipe,
    FormsModule,
    TableModule,
    ButtonModule,
    ToastModule,
    ToolbarModule,
    RatingModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    RadioButtonModule,
    InputNumberModule,
    DialogModule,
    TagModule,
    InputIconModule,
    IconFieldModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ProductService, ConfirmationService],
  templateUrl: './crud.page.html',
})
export class CrudPage implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  /** Fields included in the global table filter. */
  readonly filterFields = ['code', 'name', 'description', 'price', 'quantity', 'inventoryStatus', 'category', 'rating', 'image'];

  /** Whether the product editor dialog is visible. */
  productDialog = false;

  /** Products displayed in the table. */
  products = signal<Product[]>([]);

  /** Product currently being created or edited. */
  product!: Product;

  /** Currently selected table rows. */
  selectedProducts: Product[] | null = null;

  /** Whether the editor form was submitted. */
  submitted = false;

  /** Inventory status select options. */
  statuses: { label: string; value: string }[] = [];

  /** CSV/export table columns. */
  cols: Column[] = [];

  /** Export mappings for the table. */
  exportColumns: ExportColumn[] = [];

  /** PrimeNG table instance used for CSV export. */
  @ViewChild('dt') dt!: Table;

  /**
   * Loads product data and initializes table status/export metadata.
   */
  ngOnInit(): void {
    this.productService.getProducts().then((data) => this.products.set(data));

    this.statuses = [
      { label: 'INSTOCK', value: 'instock' },
      { label: 'LOWSTOCK', value: 'lowstock' },
      { label: 'OUTOFSTOCK', value: 'outofstock' },
    ];

    this.cols = [
      { field: 'code', header: 'Code', customExportHeader: 'Product Code' },
      { field: 'name', header: 'Name' },
      { field: 'image', header: 'Image' },
      { field: 'price', header: 'Price' },
      { field: 'category', header: 'Category' },
    ];

    this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
  }

  /** Trigger CSV export on the table. */
  exportCSV(): void {
    this.dt.exportCSV();
  }

  /**
   * @param table PrimeNG Table reference.
   * @param event Input event from the search field.
   */
  onGlobalFilter(table: Table, event: Event): void {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  /** Open a blank product editor dialog. */
  openNew(): void {
    this.product = {};
    this.submitted = false;
    this.productDialog = true;
  }

  /** @param product Product to edit. */
  editProduct(product: Product): void {
    this.product = { ...product };
    this.productDialog = true;
  }

  /** Confirm and delete all selected products. */
  deleteSelectedProducts(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete the selected products?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.products.set(this.products().filter((val) => !this.selectedProducts?.includes(val)));
        this.selectedProducts = null;
        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Products Deleted', life: 3000 });
      },
    });
  }

  /** Hide the editor dialog and clear submission state. */
  hideDialog(): void {
    this.productDialog = false;
    this.submitted = false;
  }

  /** @param product Product to delete by id. */
  deleteProduct(product: Product): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete ' + product.name + '?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.products.set(this.products().filter((val) => val.id !== product.id));
        this.product = {};
        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Product Deleted', life: 3000 });
      },
    });
  }

  /**
   * @param id Product id to locate.
   * @returns Index in the current products array, or -1 if not found.
   */
  findIndexById(id: string): number {
    return this.products().findIndex((p) => p.id === id);
  }

  /**
   * @returns A random 5-character alphanumeric id string.
   */
  createId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 5; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  /**
   * @param status Inventory status string.
   * @returns PrimeNG tag severity string.
   */
  getSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (status) {
      case 'INSTOCK':
        return 'success';
      case 'LOWSTOCK':
        return 'warn';
      case 'OUTOFSTOCK':
        return 'danger';
      default:
        return 'info';
    }
  }

  /** Save the current product as a create or update operation. */
  saveProduct(): void {
    this.submitted = true;
    const products = this.products();
    if (this.product.name?.trim()) {
      if (this.product.id) {
        products[this.findIndexById(this.product.id)] = this.product;
        this.products.set([...products]);
        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Product Updated', life: 3000 });
      } else {
        this.product.id = this.createId();
        this.product.image = 'product-placeholder.svg';
        this.products.set([...products, this.product]);
        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Product Created', life: 3000 });
      }
      this.productDialog = false;
      this.product = {};
    }
  }
}
