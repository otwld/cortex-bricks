import { TestBed } from '@angular/core/testing';
import { MenuItem } from 'primeng/api';

import {
  EcommerceNotification,
  NotificationActionEvent,
  NotificationGroup,
  NotificationSelectionEvent,
  NotificationsWidget,
  NotificationsWidgetEvent,
} from './notifications-widget';

describe(NotificationsWidget.name, () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationsWidget],
    }).compileComponents();
  });

  it('renders the default demo notifications', () => {
    const fixture = TestBed.createComponent(NotificationsWidget);

    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Notifications');
    expect(element.textContent).toContain('TODAY');
    expect(element.textContent).toContain('Richard Jones');
    expect(element.querySelectorAll('li')).toHaveLength(6);
  });

  it('renders custom notification groups from the groups input', () => {
    const fixture = TestBed.createComponent(NotificationsWidget);
    const groups: readonly NotificationGroup[] = [
      {
        id: 'priority',
        label: 'PRIORITY',
        notifications: [
          {
            id: 'chargeback',
            icon: 'pi pi-exclamation-triangle',
            tone: 'orange',
            parts: [
              { text: 'A chargeback needs review for ', variant: 'muted' },
              { text: '$142.00', variant: 'primary' },
            ],
          },
        ],
      },
    ];

    fixture.componentRef.setInput('title', 'Store Alerts');
    fixture.componentRef.setInput('groups', groups);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Store Alerts');
    expect(element.textContent).toContain('PRIORITY');
    expect(element.textContent).toContain('A chargeback needs review for');
    expect(element.querySelectorAll('li')).toHaveLength(1);
  });

  it('emits typed action events from menu commands and the event stream', () => {
    const fixture = TestBed.createComponent(NotificationsWidget);
    const action = { id: 'archive', label: 'Archive', icon: 'pi pi-inbox' };
    const actionEvents: NotificationActionEvent[] = [];
    const streamEvents: NotificationsWidgetEvent[] = [];

    fixture.componentRef.setInput('actions', [action]);
    fixture.componentInstance.actionSelected.subscribe((event) => actionEvents.push(event));
    fixture.componentInstance.events$.subscribe((event) => streamEvents.push(event));
    fixture.detectChanges();

    const menuItems = (fixture.componentInstance as unknown as { menuItems: () => MenuItem[] }).menuItems();
    menuItems[0].command?.({ originalEvent: new Event('click'), item: menuItems[0] });

    expect(actionEvents).toEqual([{ action }]);
    expect(streamEvents).toEqual([{ type: 'action', action }]);
  });

  it('emits selected notifications from rows and the event stream', () => {
    const fixture = TestBed.createComponent(NotificationsWidget);
    const notification: EcommerceNotification = {
      id: 'stock-alert',
      icon: 'pi pi-box',
      parts: [{ text: 'Only three units remain.' }],
    };
    const group: NotificationGroup = {
      id: 'inventory',
      label: 'INVENTORY',
      notifications: [notification],
    };
    const selectedEvents: NotificationSelectionEvent[] = [];
    const streamEvents: NotificationsWidgetEvent[] = [];

    fixture.componentRef.setInput('groups', [group]);
    fixture.componentInstance.notificationSelected.subscribe((event) => selectedEvents.push(event));
    fixture.componentInstance.events$.subscribe((event) => streamEvents.push(event));
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('li button') as HTMLButtonElement;
    button.click();

    expect(selectedEvents).toEqual([{ group, notification }]);
    expect(streamEvents).toEqual([{ type: 'notification', group, notification }]);
  });

  it('renders an empty state when no notification groups contain rows', () => {
    const fixture = TestBed.createComponent(NotificationsWidget);

    fixture.componentRef.setInput('groups', [{ id: 'empty', label: 'EMPTY', notifications: [] }]);
    fixture.componentRef.setInput('emptyMessage', 'No alerts right now.');
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelectorAll('li')).toHaveLength(0);
    expect(element.textContent).toContain('No alerts right now.');
  });
});
