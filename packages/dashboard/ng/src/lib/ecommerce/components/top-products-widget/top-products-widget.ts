import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { RatingModule } from 'primeng/rating';
import { Subject } from 'rxjs';

/**
 * Product summary rendered by the top products widget.
 */
export interface TopProduct {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly rating: number;
  readonly image: string;
  readonly imageAlt?: string;
}

/**
 * Payload emitted when a product is selected.
 */
export interface TopProductSelectEvent {
  readonly product: TopProduct;
}

/**
 * Union of events emitted by the top products widget event stream.
 */
export type TopProductsWidgetEvent = { readonly type: 'product' } & TopProductSelectEvent;

interface TopProductViewModel extends TopProduct {
  readonly imageSrc: string;
  readonly imageAlt: string;
  readonly price: number;
  readonly rating: number;
}

const DEFAULT_PRODUCTS: readonly TopProduct[] = [
  { id: 'bamboo-watch', name: 'Bamboo Watch', image: 'bamboo-watch.jpg', price: 65, rating: 5 },
  { id: 'black-watch', name: 'Black Watch', image: 'black-watch.jpg', price: 72, rating: 4 },
  { id: 'blue-band', name: 'Blue Band', image: 'blue-band.jpg', price: 79, rating: 3 },
  { id: 'blue-t-shirt', name: 'Blue T-Shirt', image: 'blue-t-shirt.jpg', price: 29, rating: 5 },
  { id: 'bracelet', name: 'Bracelet', image: 'bracelet.jpg', price: 15, rating: 4 },
  { id: 'brown-purse', name: 'Brown Purse', image: 'brown-purse.jpg', price: 120, rating: 4 },
];

/**
 * Ecommerce widget that renders ranked products with price and rating.
 */
@Component({
  standalone: true,
  selector: 'app-top-products-widget',
  imports: [ButtonModule, CurrencyPipe, FormsModule, RatingModule],
  templateUrl: './top-products-widget.html',
})
export class TopProductsWidget {
  private readonly destroyRef = inject(DestroyRef);
  private readonly eventsSubject = new Subject<TopProductsWidgetEvent>();

  /**
   * Widget heading shown above the product list.
   */
  readonly title = input('Top Products');

  /**
   * Products rendered in rank order.
   */
  readonly products = input<readonly TopProduct[]>(DEFAULT_PRODUCTS);

  /**
   * Maximum number of products displayed.
   */
  readonly maxProducts = input(6);

  /**
   * Base URL prepended to relative product image names.
   */
  readonly imageBaseUrl = input('https://primefaces.org/cdn/primeng/images/demo/product/');

  /**
   * Currency code passed to Angular's currency pipe.
   */
  readonly currencyCode = input('USD');

  /**
   * Currency display format passed to Angular's currency pipe.
   */
  readonly currencyDisplay = input<'code' | 'symbol' | 'symbol-narrow' | string | boolean>('symbol');

  /**
   * Digit info passed to Angular's currency pipe.
   */
  readonly currencyDigits = input('1.0-0');

  /**
   * Message shown when no products are available.
   */
  readonly emptyMessage = input('No top products to display.');

  /**
   * Emits when the user selects a product row.
   */
  readonly productSelected = output<TopProductSelectEvent>();

  /**
   * RxJS stream of all user events emitted by this widget.
   */
  readonly events$ = this.eventsSubject.asObservable();

  protected readonly productViewModels = computed(() =>
    this.products()
      .slice(0, this.limit())
      .map((product) => this.toProductViewModel(product)),
  );

  constructor() {
    this.destroyRef.onDestroy(() => this.eventsSubject.complete());
  }

  protected selectProduct(product: TopProduct): void {
    const event = { product };

    this.productSelected.emit(event);
    this.eventsSubject.next({ type: 'product', ...event });
  }

  private toProductViewModel(product: TopProduct): TopProductViewModel {
    return {
      ...product,
      price: this.normalizePrice(product.price),
      rating: this.clampRating(product.rating),
      imageSrc: this.resolveImageSrc(product.image),
      imageAlt: product.imageAlt ?? product.name,
    };
  }

  private resolveImageSrc(image: string): string {
    if (/^(https?:)?\/\//.test(image) || image.startsWith('/') || image.startsWith('data:')) {
      return image;
    }

    return `${this.imageBaseUrl()}${image}`;
  }

  private limit(): number {
    const maxProducts = this.maxProducts();

    if (!Number.isFinite(maxProducts)) {
      return DEFAULT_PRODUCTS.length;
    }

    return Math.max(0, Math.floor(maxProducts));
  }

  private normalizePrice(value: number): number {
    return Number.isFinite(value) ? value : 0;
  }

  private clampRating(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.min(5, Math.max(0, Math.round(value)));
  }
}
