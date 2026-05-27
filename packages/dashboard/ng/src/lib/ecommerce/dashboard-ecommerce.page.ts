import { Component } from '@angular/core';
import { StatsWidget } from './components/stats-widget/stats-widget';
import { RecentSalesWidget } from './components/recent-sales-widget/recent-sales-widget';
import { RevenueOverviewWidget } from './components/revenue-overview-widget/revenue-overview-widget';
import { SalesByCategoryWidget } from './components/sales-by-category-widget/sales-by-category-widget';
import { TopProductsWidget } from './components/top-products-widget/top-products-widget';
import { BestSellingWidget } from './components/best-selling-widget/best-selling-widget';
import { NotificationsWidget } from './components/notifications-widget/notifications-widget';
import { RevenueStreamWidget } from './components/revenue-stream-widget/revenue-stream-widget';

/**
 * Provides dashboard ecommerce page behavior.
 */
@Component({
  selector: 'dashboard-ecommerce',
  imports: [
    StatsWidget,
    RecentSalesWidget,
    RevenueOverviewWidget,
    SalesByCategoryWidget,
    TopProductsWidget,
    BestSellingWidget,
    NotificationsWidget,
    RevenueStreamWidget,
  ],
  templateUrl: './dashboard-ecommerce.page.html',
})
export class DashboardEcommercePage {}
