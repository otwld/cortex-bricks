import { Component, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';
import { Ripple } from 'primeng/ripple';

/** FAQ page with category sidebar and accordion Q&A panels. */
@Component({
  selector: 'app-faq-page',
  imports: [AccordionModule, NgClass, Ripple],
  templateUrl: './faq.page.html'
})
export class FaqPage implements OnInit {
  /** Category items, each containing questions and an accordion value. */
  items: { label: string; icon: string; questions: string[]; value: string }[] = [];

  /** Index of the currently active category. */
  activeIndex = 0;

  /** Populate the static FAQ category list when the page initializes. */
  ngOnInit(): void {
    this.items = [
      { label: 'General',  icon: 'pi pi-fw pi-info-circle',    questions: ['Is there a trial period?', 'Do I need to sign up with credit card?', 'Is the subscription monthly or annual?', 'How many tiers are there?'], value: '0' },
      { label: 'Mailing',  icon: 'pi pi-fw pi-envelope',       questions: ['How do I setup my account?', 'Is there a limit on mails to send?', 'What is my inbox size?', 'How can I add attachements?'], value: '1' },
      { label: 'Support',  icon: 'pi pi-fw pi-question-circle', questions: ['How can I get support?', 'What is the response time?', 'Is there a community forum?', 'Is live chat available?'], value: '2' },
      { label: 'Billing',  icon: 'pi pi-fw pi-credit-card',    questions: ['Will I receive an invoice?', 'How to provide my billing information?', 'Is VAT included?', 'Can I receive PDF invoices?'], value: '3' },
    ];
  }

  /** @param i Index of the category to activate. */
  changeItem(i: number): void {
    this.activeIndex = i;
  }
}
