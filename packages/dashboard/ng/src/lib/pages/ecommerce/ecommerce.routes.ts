import { Routes } from '@angular/router';

/** Lazy routes for the e-commerce pages section. */
export const ecommerceRoutes: Routes = [
  { path: 'product-overview', data: { breadcrumb: 'Product Overview' }, loadComponent: () => import('./product-overview/product-overview.page').then((c) => c.ProductOverviewPage) },
  { path: 'product-list', data: { breadcrumb: 'Product List' }, loadComponent: () => import('./product-list/product-list.page').then((c) => c.ProductListPage) },
  { path: 'new-product', data: { breadcrumb: 'New Product' }, loadComponent: () => import('./new-product/new-product.page').then((c) => c.NewProductPage) },
  { path: 'shopping-cart', data: { breadcrumb: 'Shopping Cart' }, loadComponent: () => import('./shopping-cart/shopping-cart.page').then((c) => c.ShoppingCartPage) },
  { path: 'checkout-form', data: { breadcrumb: 'Checkout Form' }, loadComponent: () => import('./checkout-form/checkout-form.page').then((c) => c.CheckoutFormPage) },
  { path: 'order-history', data: { breadcrumb: 'Order History' }, loadComponent: () => import('./order-history/order-history.page').then((c) => c.OrderHistoryPage) },
  { path: 'order-summary', data: { breadcrumb: 'Order Summary' }, loadComponent: () => import('./order-summary/order-summary.page').then((c) => c.OrderSummaryPage) },
];
