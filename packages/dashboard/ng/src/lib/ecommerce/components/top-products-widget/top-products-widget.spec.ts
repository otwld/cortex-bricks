import { TestBed } from '@angular/core/testing';

import { TopProduct, TopProductSelectEvent, TopProductsWidget } from './top-products-widget';

describe(TopProductsWidget.name, () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopProductsWidget],
    }).compileComponents();
  });

  it('renders the default top products', () => {
    const fixture = TestBed.createComponent(TopProductsWidget);

    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Top Products');
    expect(element.textContent).toContain('Bamboo Watch');
    expect(element.textContent).toContain('$65');
  });

  it('builds product view models from custom inputs', () => {
    const fixture = TestBed.createComponent(TopProductsWidget);
    const products: readonly TopProduct[] = [
      { id: 'desk', name: 'Desk', image: 'desk.jpg', price: 1200.2, rating: 7 },
      { id: 'chair', name: 'Chair', image: '/assets/chair.jpg', price: Number.NaN, rating: Number.NaN, imageAlt: 'Office chair' },
    ];

    fixture.componentRef.setInput('products', products);
    fixture.componentRef.setInput('maxProducts', 1);
    fixture.componentRef.setInput('imageBaseUrl', '/products/');
    fixture.detectChanges();

    const viewModels = (
      fixture.componentInstance as unknown as {
        productViewModels: () => Array<{ id: string; imageSrc: string; price: number; rating: number }>;
      }
    ).productViewModels();

    expect(fixture.nativeElement.textContent).toContain('Desk');
    expect(fixture.nativeElement.textContent).not.toContain('Chair');
    expect(viewModels.length).toBe(1);
    expect(viewModels[0].id).toBe('desk');
    expect(viewModels[0].imageSrc).toBe('/products/desk.jpg');
    expect(viewModels[0].price).toBe(1200.2);
    expect(viewModels[0].rating).toBe(5);
  });

  it('emits typed product selection events', () => {
    const fixture = TestBed.createComponent(TopProductsWidget);
    const selections: TopProductSelectEvent[] = [];
    const events: unknown[] = [];

    fixture.componentInstance.productSelected.subscribe((event) => selections.push(event));
    fixture.componentInstance.events$.subscribe((event) => events.push(event));
    fixture.detectChanges();

    const product = (
      fixture.componentInstance as unknown as {
        productViewModels: () => TopProduct[];
      }
    ).productViewModels()[0];
    if (!product) throw new Error('Expected a demo top product view model.');

    (fixture.componentInstance as unknown as { selectProduct(product: TopProduct): void }).selectProduct(product);

    expect(selections).toEqual([{ product }]);
    expect(events).toEqual([{ type: 'product', product }]);
  });

  it('renders an empty state when no products are provided', () => {
    const fixture = TestBed.createComponent(TopProductsWidget);

    fixture.componentRef.setInput('products', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No top products to display.');
  });
});
