import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ButtonGroupModule } from 'primeng/buttongroup';
import { SplitButtonModule } from 'primeng/splitbutton';

const SPLIT_BUTTON_ITEMS: MenuItem[] = [
  { label: 'Update', icon: 'pi pi-refresh' },
  { label: 'Delete', icon: 'pi pi-times' },
  {
    label: 'Angular.dev',
    icon: 'pi pi-info',
    url: 'https://angular.dev',
  },
  { separator: true },
  { label: 'Setup', icon: 'pi pi-cog' },
];

/**
 * PrimeNG button showcase for default, severity, icon, grouped, split, and loading states.
 */
@Component({
  selector: 'dashboard-uikit-buttons-page',
  imports: [ButtonModule, ButtonGroupModule, SplitButtonModule],
  templateUrl: './dashboard-uikit-buttons.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardUikitButtonsPage {
  protected readonly splitButtonItems = SPLIT_BUTTON_ITEMS;
  protected readonly loading = signal([false, false, false, false]);

  /**
   * Starts a short loading state for the selected demo button.
   */
  protected load(index: number): void {
    this.setLoading(index, true);
    setTimeout(() => this.setLoading(index, false), 1000);
  }

  private setLoading(index: number, isLoading: boolean): void {
    this.loading.update((values) => values.map((value, valueIndex) => (valueIndex === index ? isLoading : value)));
  }
}
