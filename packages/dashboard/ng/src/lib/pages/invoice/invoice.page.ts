import { Component } from '@angular/core';
import { Card } from 'primeng/card';

/** Print-formatted invoice display page. */
@Component({
  selector: 'app-invoice-page',
  imports: [Card],
  templateUrl: './invoice.page.html'
})
export class InvoicePage {}
