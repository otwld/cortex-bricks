import { Component, computed, input, output } from '@angular/core';

import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { ProgressBarModule } from 'primeng/progressbar';
import { Card } from 'primeng/card';

/**
 * Visual tone used by best-selling product progress rows.
 */
export type BestSellingTone = 'orange' | 'cyan' | 'pink' | 'green' | 'purple' | 'teal' | 'primary';

/**
 * Product summary rendered by the best-selling products widget.
 */
export interface BestSellingProduct {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly salesShare: number;
  readonly tone?: BestSellingTone;
}

/**
 * Header menu action exposed by the best-selling products widget.
 */
export interface BestSellingAction {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
}

/**
 * Payload emitted when a widget menu action is selected.
 */
export interface BestSellingActionEvent {
  readonly action: BestSellingAction;
}

interface BestSellingProductViewModel extends BestSellingProduct {
  readonly salesShare: number;
  readonly percentLabel: string;
  readonly progressClass: string;
  readonly textClass: string;
}

const DEFAULT_PRODUCTS: readonly BestSellingProduct[] = [
  { id: 'space-t-shirt', name: 'Space T-Shirt', category: 'Clothing', salesShare: 50, tone: 'orange' },
  { id: 'portal-sticker', name: 'Portal Sticker', category: 'Accessories', salesShare: 16, tone: 'cyan' },
  { id: 'supernova-sticker', name: 'Supernova Sticker', category: 'Accessories', salesShare: 67, tone: 'pink' },
  { id: 'wonders-notebook', name: 'Wonders Notebook', category: 'Office', salesShare: 35, tone: 'green' },
  { id: 'mat-black-case', name: 'Mat Black Case', category: 'Accessories', salesShare: 75, tone: 'purple' },
  { id: 'robots-t-shirt', name: 'Robots T-Shirt', category: 'Clothing', salesShare: 40, tone: 'teal' },
];

const DEFAULT_ACTIONS: readonly BestSellingAction[] = [
  { id: 'add', label: 'Add New', icon: 'pi pi-fw pi-plus' },
  { id: 'remove', label: 'Remove', icon: 'pi pi-fw pi-trash' },
];

const TONE_CLASSES: Record<BestSellingTone, Pick<BestSellingProductViewModel, 'progressClass' | 'textClass'>> = {
  orange: { progressClass: 'bg-orange-500', textClass: 'text-orange-500' },
  cyan: { progressClass: 'bg-cyan-500', textClass: 'text-cyan-500' },
  pink: { progressClass: 'bg-pink-500', textClass: 'text-pink-500' },
  green: { progressClass: 'bg-green-500', textClass: 'text-green-500' },
  purple: { progressClass: 'bg-purple-500', textClass: 'text-purple-500' },
  teal: { progressClass: 'bg-teal-500', textClass: 'text-teal-500' },
  primary: { progressClass: 'bg-primary', textClass: 'text-primary' },
};

/**
 * Ecommerce widget that ranks products by sales share.
 */
@Component({
  selector: 'app-best-selling-widget',
  imports: [ButtonModule, MenuModule, ProgressBarModule, Card],
  templateUrl: './best-selling-widget.html',
})
export class BestSellingWidget {
  /**
   * Widget heading shown above the product list.
   */
  readonly title = input('Best Selling Products');

  /**
   * Products to render. Values outside 0-100 are clamped for display.
   */
  readonly products = input<readonly BestSellingProduct[]>(DEFAULT_PRODUCTS);

  /**
   * Popup menu actions shown in the widget header.
   */
  readonly actions = input<readonly BestSellingAction[]>(DEFAULT_ACTIONS);

  /**
   * Emits when the user chooses an action from the header menu.
   */
  readonly actionSelected = output<BestSellingActionEvent>();

  public readonly productViewModels = computed(() =>
    this.products().map((product) => this.toProductViewModel(product)),
  );

  public readonly menuItems = computed<MenuItem[]>(() =>
    this.actions().map((action) => ({
      label: action.label,
      icon: action.icon,
      command: () => this.actionSelected.emit({ action }),
    })),
  );

  // Keep normalization in one computed path so the template stays declarative.
  private toProductViewModel(product: BestSellingProduct): BestSellingProductViewModel {
    const salesShare = this.clampPercent(product.salesShare);
    const classes = TONE_CLASSES[product.tone ?? 'primary'];

    return {
      ...product,
      salesShare,
      percentLabel: `${salesShare}%`,
      progressClass: classes.progressClass,
      textClass: classes.textClass,
    };
  }

  private clampPercent(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.min(100, Math.max(0, Math.round(value)));
  }
}
