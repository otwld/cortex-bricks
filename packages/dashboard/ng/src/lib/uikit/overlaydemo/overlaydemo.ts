import { Component, inject, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { DrawerModule } from 'primeng/drawer';
import { Popover, PopoverModule } from 'primeng/popover';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { TableRowSelectEvent } from 'primeng/types/table';
import { Card } from 'primeng/card';
import { Product, ProductService } from '@otwld/ng-dashboard/core';

/**
 * Demonstrates PrimeNG dialog, drawer, popover, tooltip, and confirmation overlays.
 */
@Component({
  selector: 'app-overlay-demo',
  imports: [
    ToastModule,
    DialogModule,
    ButtonModule,
    DrawerModule,
    PopoverModule,
    ConfirmPopupModule,
    InputTextModule,
    FormsModule,
    TooltipModule,
    TableModule,
    ToastModule,
    Card,
  ],
  templateUrl: './overlaydemo.html',
  providers: [ConfirmationService, MessageService, ProductService],
})
export class OverlayDemo implements OnInit {
  protected display = false;

  protected products: Product[] = [];

  protected visibleLeft = false;

  protected visibleRight = false;

  protected visibleTop = false;

  protected visibleBottom = false;

  protected visibleFull = false;

  protected displayConfirmation = false;

  protected selectedProduct: Product | null = null;

  private readonly productService = inject(ProductService);

  private readonly confirmationService = inject(ConfirmationService);

  private readonly messageService = inject(MessageService);

  /**
   * Loads sample products for the popover table.
   */
  ngOnInit(): void {
    this.productService.getProductsSmall().then((products) => (this.products = products));
  }

  /**
   * Opens a PrimeNG confirm popup from the triggering event target.
   */
  protected confirm(event: Event): void {
    this.confirmationService.confirm({
      key: 'confirm2',
      target: event.target || new EventTarget(),
      message: 'Are you sure that you want to proceed?',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Save',
      },
      accept: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Confirmed',
          detail: 'You have accepted',
        });
      },
      reject: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Rejected',
          detail: 'You have rejected',
        });
      },
    });
  }

  /**
   * Opens the dialog demo.
   */
  protected open(): void {
    this.display = true;
  }

  /**
   * Closes the dialog demo.
   */
  protected close(): void {
    this.display = false;
  }

  /**
   * Toggles the product table popover.
   */
  protected toggleDataTable(op: Popover, event: Event): void {
    op.toggle(event);
  }

  /**
   * Handles product row selection from the popover table.
   */
  protected onProductSelect(op: Popover, event: TableRowSelectEvent<Product | Product[]>): void {
    const product = (Array.isArray(event.data) ? event.data[0] : event.data) as Product | undefined;

    op.hide();
    this.messageService.add({
      severity: 'info',
      summary: 'Product Selected',
      detail: product?.name,
      life: 3000,
    });
  }

  /**
   * Opens the custom confirmation dialog.
   */
  protected openConfirmation(): void {
    this.displayConfirmation = true;
  }

  /**
   * Closes the custom confirmation dialog.
   */
  protected closeConfirmation(): void {
    this.displayConfirmation = false;
  }
}
