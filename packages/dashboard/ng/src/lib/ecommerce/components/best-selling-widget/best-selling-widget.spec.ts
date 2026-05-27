import { TestBed } from '@angular/core/testing';
import { MenuItem } from 'primeng/api';

import { BestSellingActionEvent, BestSellingProduct, BestSellingWidget } from './best-selling-widget';

describe(BestSellingWidget.name, () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BestSellingWidget],
    }).compileComponents();
  });

  it('renders the default demo products', () => {
    const fixture = TestBed.createComponent(BestSellingWidget);

    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Best Selling Products');
    expect(element.textContent).toContain('Space T-Shirt');
    expect(element.querySelectorAll('li')).toHaveLength(6);
  });

  it('renders custom products from the products input', () => {
    const fixture = TestBed.createComponent(BestSellingWidget);
    const products: readonly BestSellingProduct[] = [
      { id: 'keyboard', name: 'Mechanical Keyboard', category: 'Hardware', salesShare: 63, tone: 'cyan' },
      { id: 'monitor', name: 'Studio Monitor', category: 'Hardware', salesShare: 28, tone: 'purple' },
    ];

    fixture.componentRef.setInput('title', 'Top Sellers');
    fixture.componentRef.setInput('products', products);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Top Sellers');
    expect(element.textContent).toContain('Mechanical Keyboard');
    expect(element.textContent).toContain('Studio Monitor');
    expect(element.querySelectorAll('li')).toHaveLength(2);
  });

  it('clamps and rounds product percentages for display', () => {
    const fixture = TestBed.createComponent(BestSellingWidget);
    const products: readonly BestSellingProduct[] = [
      { id: 'low', name: 'Low Product', category: 'Demo', salesShare: -12 },
      { id: 'high', name: 'High Product', category: 'Demo', salesShare: 125 },
      { id: 'round', name: 'Rounded Product', category: 'Demo', salesShare: 42.4 },
    ];

    fixture.componentRef.setInput('products', products);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('0%');
    expect(element.textContent).toContain('100%');
    expect(element.textContent).toContain('42%');
  });

  it('emits typed action events from menu commands', () => {
    const fixture = TestBed.createComponent(BestSellingWidget);
    const action = { id: 'export', label: 'Export', icon: 'pi pi-upload' };
    const events: BestSellingActionEvent[] = [];

    fixture.componentRef.setInput('actions', [action]);
    fixture.componentInstance.actionSelected.subscribe((event) => events.push(event));
    fixture.detectChanges();

    const menuItems = (fixture.componentInstance as unknown as { menuItems: () => MenuItem[] }).menuItems();
    menuItems[0].command?.({ originalEvent: new Event('click'), item: menuItems[0] });

    expect(events).toEqual([{ action }]);
  });

  it('renders an empty state when no products are provided', () => {
    const fixture = TestBed.createComponent(BestSellingWidget);

    fixture.componentRef.setInput('products', []);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelectorAll('li')).toHaveLength(0);
    expect(element.textContent).toContain('No best-selling products to display.');
  });
});
