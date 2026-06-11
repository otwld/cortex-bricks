import { NgStyle } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { GalleriaModule } from 'primeng/galleria';
import { ImageModule } from 'primeng/image';
import { TagModule } from 'primeng/tag';
import { CarouselResponsiveOptions } from 'primeng/types/carousel';
import { GalleriaResponsiveOptions } from 'primeng/types/galleria';
import { ImageCompareModule } from 'primeng/imagecompare';
import { PhotoService, ProductService, type Photo, type Product } from '@otwld/ng-dashboard/core';

/**
 * Demonstrates PrimeNG media components including carousel, image, image compare, and galleria.
 */
@Component({
  selector: 'app-media-demo',
  imports: [NgStyle, CarouselModule, ButtonModule, GalleriaModule, ImageModule, TagModule, ImageCompareModule],
  templateUrl: './mediademo.html',
  providers: [ProductService, PhotoService],
})
export class MediaDemo implements OnInit {
  protected readonly products = signal<Product[]>([]);

  protected readonly images = signal<Photo[]>([]);

  protected readonly galleriaResponsiveOptions: GalleriaResponsiveOptions[] = [
    {
      breakpoint: '1024px',
      numVisible: 5,
    },
    {
      breakpoint: '960px',
      numVisible: 4,
    },
    {
      breakpoint: '768px',
      numVisible: 3,
    },
    {
      breakpoint: '560px',
      numVisible: 1,
    },
  ];

  protected readonly carouselResponsiveOptions: CarouselResponsiveOptions[] = [
    {
      breakpoint: '1024px',
      numVisible: 3,
      numScroll: 3,
    },
    {
      breakpoint: '768px',
      numVisible: 2,
      numScroll: 2,
    },
    {
      breakpoint: '560px',
      numVisible: 1,
      numScroll: 1,
    },
  ];

  private readonly productService = inject(ProductService);

  private readonly photoService = inject(PhotoService);

  /**
   * Loads sample products and images for the media demos.
   */
  ngOnInit(): void {
    this.productService.getProductsSmall().then((products) => {
      this.products.set(products);
    });

    this.photoService.getImages().then((images) => {
      this.images.set(images);
    });
  }

  /**
   * Maps inventory status to a PrimeNG tag severity.
   */
  protected getSeverity(status: string | undefined): 'success' | 'warn' | 'danger' {
    switch (status) {
      case 'INSTOCK':
        return 'success';
      case 'LOWSTOCK':
        return 'warn';
      case 'OUTOFSTOCK':
        return 'danger';
      default:
        return 'success';
    }
  }
}
