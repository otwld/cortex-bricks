import { Component, DestroyRef, computed, inject, input, output } from '@angular/core';

import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { Subject } from 'rxjs';

export type NotificationTone = 'blue' | 'orange' | 'pink' | 'green' | 'purple' | 'cyan' | 'teal' | 'primary';

export type NotificationTextVariant = 'default' | 'muted' | 'primary';

/**
 * Inline text fragment rendered inside a notification row.
 */
export interface NotificationTextPart {
  readonly text: string;
  readonly variant?: NotificationTextVariant;
}

/**
 * Notification rendered by the ecommerce notifications widget.
 */
export interface EcommerceNotification {
  readonly id: string;
  readonly icon: string;
  readonly tone?: NotificationTone;
  readonly parts: readonly NotificationTextPart[];
  readonly ariaLabel?: string;
}

/**
 * Labelled notification group, such as Today or Last Week.
 */
export interface NotificationGroup {
  readonly id: string;
  readonly label: string;
  readonly notifications: readonly EcommerceNotification[];
}

/**
 * Header menu action exposed by the notifications widget.
 */
export interface NotificationAction {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
}

/**
 * Payload emitted when a widget menu action is selected.
 */
export interface NotificationActionEvent {
  readonly action: NotificationAction;
}

/**
 * Payload emitted when a notification row is selected.
 */
export interface NotificationSelectionEvent {
  readonly group: NotificationGroup;
  readonly notification: EcommerceNotification;
}

export type NotificationsWidgetEvent =
  | ({ readonly type: 'action' } & NotificationActionEvent)
  | ({ readonly type: 'notification' } & NotificationSelectionEvent);

interface NotificationGroupViewModel extends NotificationGroup {
  readonly source: NotificationGroup;
  readonly notifications: readonly NotificationViewModel[];
}

interface NotificationViewModel extends EcommerceNotification {
  readonly source: EcommerceNotification;
  readonly iconClass: string;
  readonly iconContainerClass: string;
  readonly textLabel: string;
  readonly parts: readonly NotificationTextViewModel[];
}

interface NotificationTextViewModel extends NotificationTextPart {
  readonly className: string;
}

const DEFAULT_GROUPS: readonly NotificationGroup[] = [
  {
    id: 'today',
    label: 'TODAY',
    notifications: [
      {
        id: 'richard-jones-purchase',
        icon: 'pi pi-dollar',
        tone: 'blue',
        parts: [{ text: 'Richard Jones' }, { text: ' has purchased a blue t-shirt for ', variant: 'muted' }, { text: '$79.00', variant: 'primary' }],
      },
      {
        id: 'withdrawal-initiated',
        icon: 'pi pi-download',
        tone: 'orange',
        parts: [
          { text: 'Your request for withdrawal of ', variant: 'muted' },
          { text: '$2500.00', variant: 'primary' },
          { text: ' has been initiated.', variant: 'muted' },
        ],
      },
    ],
  },
  {
    id: 'yesterday',
    label: 'YESTERDAY',
    notifications: [
      {
        id: 'keyser-wick-purchase',
        icon: 'pi pi-dollar',
        tone: 'blue',
        parts: [{ text: 'Keyser Wick' }, { text: ' has purchased a black jacket for ', variant: 'muted' }, { text: '$59.00', variant: 'primary' }],
      },
      {
        id: 'jane-davis-question',
        icon: 'pi pi-question',
        tone: 'pink',
        parts: [{ text: 'Jane Davis' }, { text: ' has posted a new questions about your product.', variant: 'muted' }],
      },
    ],
  },
  {
    id: 'last-week',
    label: 'LAST WEEK',
    notifications: [
      {
        id: 'revenue-increased',
        icon: 'pi pi-arrow-up',
        tone: 'green',
        parts: [{ text: 'Your revenue has increased by ' }, { text: '%25', variant: 'primary' }, { text: '.' }],
      },
      {
        id: 'wishlist-adds',
        icon: 'pi pi-heart',
        tone: 'purple',
        parts: [{ text: '12', variant: 'primary' }, { text: ' users have added your products to their wishlist.' }],
      },
    ],
  },
];

const DEFAULT_ACTIONS: readonly NotificationAction[] = [
  { id: 'add', label: 'Add New', icon: 'pi pi-fw pi-plus' },
  { id: 'remove', label: 'Remove', icon: 'pi pi-fw pi-trash' },
];

const TONE_CLASSES: Record<NotificationTone, Pick<NotificationViewModel, 'iconClass' | 'iconContainerClass'>> = {
  blue: { iconClass: 'text-blue-500', iconContainerClass: 'bg-blue-100 dark:bg-blue-400/10' },
  orange: { iconClass: 'text-orange-500', iconContainerClass: 'bg-orange-100 dark:bg-orange-400/10' },
  pink: { iconClass: 'text-pink-500', iconContainerClass: 'bg-pink-100 dark:bg-pink-400/10' },
  green: { iconClass: 'text-green-500', iconContainerClass: 'bg-green-100 dark:bg-green-400/10' },
  purple: { iconClass: 'text-purple-500', iconContainerClass: 'bg-purple-100 dark:bg-purple-400/10' },
  cyan: { iconClass: 'text-cyan-500', iconContainerClass: 'bg-cyan-100 dark:bg-cyan-400/10' },
  teal: { iconClass: 'text-teal-500', iconContainerClass: 'bg-teal-100 dark:bg-teal-400/10' },
  primary: { iconClass: 'text-primary', iconContainerClass: 'bg-primary-100 dark:bg-primary-400/10' },
};

const TEXT_CLASSES: Record<NotificationTextVariant, string> = {
  default: 'text-surface-900 dark:text-surface-0',
  muted: 'text-surface-700 dark:text-surface-100',
  primary: 'font-bold text-primary',
};

@Component({
  selector: 'app-notifications-widget',
  imports: [ButtonModule, MenuModule],
  templateUrl: './notifications-widget.html',
})
export class NotificationsWidget {
  private readonly eventsSubject = new Subject<NotificationsWidgetEvent>();
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Widget heading shown above the notification list.
   */
  readonly title = input('Notifications');

  /**
   * Label announced for the popup menu trigger.
   */
  readonly actionMenuAriaLabel = input('Notification actions');

  /**
   * Labelled notification groups to render.
   */
  readonly groups = input<readonly NotificationGroup[]>(DEFAULT_GROUPS);

  /**
   * Popup menu actions shown in the widget header.
   */
  readonly actions = input<readonly NotificationAction[]>(DEFAULT_ACTIONS);

  /**
   * Message shown when no notification groups contain rows.
   */
  readonly emptyMessage = input('No notifications to display.');

  /**
   * Emits when the user chooses an action from the header menu.
   */
  readonly actionSelected = output<NotificationActionEvent>();

  /**
   * Emits when the user selects a notification row.
   */
  readonly notificationSelected = output<NotificationSelectionEvent>();

  /**
   * RxJS stream of all user events emitted by this widget.
   */
  readonly events$ = this.eventsSubject.asObservable();

  protected readonly groupViewModels = computed<NotificationGroupViewModel[]>(() =>
    this.groups()
      .map((group) => ({
        ...group,
        source: group,
        notifications: group.notifications.map((notification) => this.toNotificationViewModel(notification)),
      }))
      .filter((group) => group.notifications.length > 0),
  );

  protected readonly menuItems = computed<MenuItem[]>(() =>
    this.actions().map((action) => ({
      label: action.label,
      icon: action.icon,
      command: () => this.selectAction(action),
    })),
  );

  constructor() {
    this.destroyRef.onDestroy(() => this.eventsSubject.complete());
  }

  protected selectNotification(group: NotificationGroupViewModel, notification: NotificationViewModel): void {
    const event = { group: group.source, notification: notification.source };

    this.notificationSelected.emit(event);
    this.eventsSubject.next({ type: 'notification', ...event });
  }

  private selectAction(action: NotificationAction): void {
    const event = { action };

    this.actionSelected.emit(event);
    this.eventsSubject.next({ type: 'action', ...event });
  }

  private toNotificationViewModel(notification: EcommerceNotification): NotificationViewModel {
    const classes = TONE_CLASSES[notification.tone ?? 'primary'];
    const parts = notification.parts.map((part) => ({
      ...part,
      className: TEXT_CLASSES[part.variant ?? 'default'],
    }));

    return {
      ...notification,
      ...classes,
      source: notification,
      parts,
      textLabel: parts.map((part) => part.text).join(''),
    };
  }
}
