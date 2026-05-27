import { NgStyle } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DashboardLayoutService } from '@otwld/ng-dashboard/core';
import { ButtonModule } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

/** Contact us page with map placeholder and email form. */
@Component({
  selector: 'app-contact-us-page',
  imports: [NgStyle, FormsModule, InputTextModule, TextareaModule, ButtonModule, IconField, InputIcon],
  templateUrl: './contact-us.page.html',
})
export class ContactUsPage {
  private readonly layoutService = inject(DashboardLayoutService);

  /** Name field value. */
  name = '';

  /** Email field value. */
  email = '';

  /** Message field value. */
  message = '';

  /** Contact info cards displayed below the map. */
  readonly content = [
    { icon: 'pi pi-fw pi-phone', title: 'Phone', info: '1 (833) 597-7538' },
    { icon: 'pi pi-fw pi-map-marker', title: 'Our Head Office', info: 'Churchill-laan 16 II, 1052 CD, Amsterdam' },
    { icon: 'pi pi-fw pi-print', title: 'Fax', info: '3 (833) 297-1548' },
  ];

  /** Inline style object that switches the map background for dark/light theme. */
  readonly mapStyle = computed(() => ({
    'background-image': this.layoutService.isDarkTheme() ? "url('/demo/images/contact/map-dark.svg')" : "url('/demo/images/contact/map-light.svg')",
  }));
}
