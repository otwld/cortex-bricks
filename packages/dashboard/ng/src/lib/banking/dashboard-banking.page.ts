import { Component } from '@angular/core';
import { HeaderWidget } from './components/header-widget/header-widget';
import { StatsBankingWidget } from './components/stats-banking-widget/stats-banking-widget';
import { RecentTransactionsWidget } from './components/recent-transactions-widget/recent-transactions-widget';
import { OverviewWidget } from './components/overview-widget/overview-widget';
import { RecentTransactionsTwoWidget } from './components/recent-transactions-two-widget/recent-transactions-two-widget';
import { MonthlyPaymentsWidget } from './components/monthly-payments-widget/monthly-payments-widget';

/**
 * Provides dashboard banking page behavior.
 */
@Component({
  selector: 'app-banking-dashboard',
  standalone: true,
  imports: [HeaderWidget, StatsBankingWidget, RecentTransactionsWidget, OverviewWidget, RecentTransactionsTwoWidget, MonthlyPaymentsWidget],
  templateUrl: './dashboard-banking.page.html',
})
export class DashboardBankingPage {}
