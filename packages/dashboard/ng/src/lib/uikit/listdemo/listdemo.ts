import { NgClass } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DataViewModule } from 'primeng/dataview';
import { OrderListModule } from 'primeng/orderlist';
import { PickListModule } from 'primeng/picklist';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { Card } from 'primeng/card';
import { Product, ProductService } from '@otwld/ng-dashboard/core';

interface CityOption {
  name: string;
  code: string;
}

/**
 * Demonstrates PrimeNG DataView, PickList, and OrderList components.
 */
@Component({
  selector: 'app-list-demo',
  imports: [NgClass, DataViewModule, FormsModule, SelectButtonModule, PickListModule, OrderListModule, TagModule, ButtonModule, Card],
  templateUrl: './listdemo.html',
  styles: `
    ::ng-deep {
      .p-orderlist-list-container {
        width: 100%;
      }
    }
  `,
  providers: [ProductService],
})
export class ListDemo implements OnInit {
  protected layout: 'list' | 'grid' = 'list';

  protected readonly options: string[] = ['list', 'grid'];

  protected products: Product[] = [];

  protected sourceCities: CityOption[] = [];

  protected targetCities: CityOption[] = [];

  protected orderCities: CityOption[] = [];

  private readonly productService = inject(ProductService);

  /**
   * Loads sample products and city collections for list demos.
   */
  ngOnInit(): void {
    this.productService.getProductsSmall().then((data) => (this.products = data.slice(0, 6)));

    this.sourceCities = [
      { name: 'San Francisco', code: 'SF' },
      { name: 'London', code: 'LDN' },
      { name: 'Paris', code: 'PRS' },
      { name: 'Istanbul', code: 'IST' },
      { name: 'Berlin', code: 'BRL' },
      { name: 'Barcelona', code: 'BRC' },
      { name: 'Rome', code: 'RM' },
    ];

    this.targetCities = [];

    this.orderCities = [
      { name: 'San Francisco', code: 'SF' },
      { name: 'London', code: 'LDN' },
      { name: 'Paris', code: 'PRS' },
      { name: 'Istanbul', code: 'IST' },
      { name: 'Berlin', code: 'BRL' },
      { name: 'Barcelona', code: 'BRC' },
      { name: 'Rome', code: 'RM' },
    ];
  }

  /**
   * Maps product inventory status to a PrimeNG tag severity.
   */
  protected getSeverity(product: Product): 'success' | 'warn' | 'danger' | 'info' {
    switch (product.inventoryStatus) {
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
}
