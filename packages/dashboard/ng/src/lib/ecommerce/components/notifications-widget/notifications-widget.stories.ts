import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn, within } from 'storybook/test';
import {
  type NotificationAction,
  type NotificationGroup,
  NotificationsWidget,
} from './notifications-widget';

const actionSelected = fn();
const notificationSelected = fn();

const groups: readonly NotificationGroup[] = [
  {
    id: 'today',
    label: 'TODAY',
    notifications: [
      {
        id: 'candidate-shortlist',
        icon: 'pi pi-users',
        tone: 'blue',
        parts: [
          { text: 'Candidate shortlist' },
          { text: ' is ready for the Senior Angular JobOffer.', variant: 'muted' },
        ],
      },
      {
        id: 'interview-confirmed',
        icon: 'pi pi-calendar',
        tone: 'green',
        parts: [
          { text: 'Interview' },
          { text: ' confirmed with the recruiter panel.', variant: 'muted' },
        ],
      },
    ],
  },
];

const actions: readonly NotificationAction[] = [
  { id: 'add', label: 'Add New', icon: 'pi pi-fw pi-plus' },
  { id: 'remove', label: 'Remove', icon: 'pi pi-fw pi-trash' },
];

const meta: Meta<NotificationsWidget> = {
  argTypes: {
    actionMenuAriaLabel: {
      control: 'text',
      description: 'Accessible label for the popup menu trigger.',
      table: { category: 'Inputs' },
    },
    actionSelected: {
      action: 'actionSelected',
      description: 'Emitted when the header menu action is selected.',
      table: { category: 'Outputs' },
    },
    actions: {
      control: 'object',
      description: 'Popup menu actions shown in the widget header.',
      table: { category: 'Inputs' },
    },
    emptyMessage: {
      control: 'text',
      description: 'Message shown when no notification groups contain rows.',
      table: { category: 'Inputs' },
    },
    groups: {
      control: 'object',
      description: 'Labelled notification groups to render.',
      table: { category: 'Inputs' },
    },
    notificationSelected: {
      action: 'notificationSelected',
      description: 'Emitted when a notification row is selected.',
      table: { category: 'Outputs' },
    },
    title: {
      control: 'text',
      description: 'Heading shown above the notification list.',
      table: { category: 'Inputs' },
    },
  },
  args: {
    actionMenuAriaLabel: 'Notification actions',
    actionSelected,
    actions,
    emptyMessage: 'No notifications to display.',
    groups,
    notificationSelected,
  title: 'dashboard/ng/ecommerce/notifications-widget',
  },
  component: NotificationsWidget,
  render: (args) => ({
    props: args,
    template: `
      <app-notifications-widget
        [title]="title"
        [actionMenuAriaLabel]="actionMenuAriaLabel"
        [groups]="groups"
        [actions]="actions"
        [emptyMessage]="emptyMessage"
        (actionSelected)="actionSelected($event)"
        (notificationSelected)="notificationSelected($event)"
      />
    `,
  }),
  title: 'dashboard/ng/ecommerce/notifications-widget',
};

export default meta;

type Story = StoryObj<NotificationsWidget>;

/** Default Notifications Widget state. */
export const Default: Story = {
  play: async ({ canvas, canvasElement, step, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await step('render grouped notifications', async () => {
      await expect(canvas.getByText('Notifications')).toBeVisible();
      await expect(canvas.getByText('TODAY')).toBeVisible();
      await expect(canvas.getByText('Candidate shortlist')).toBeVisible();
      await expect(canvas.getByText(/senior angular joboffer/i)).toBeVisible();
    });

    await step('emit notification and menu actions', async () => {
      actionSelected.mockClear();
      notificationSelected.mockClear();

      await userEvent.click(canvas.getByRole('button', { name: /candidate shortlist/i }));
      await expect(notificationSelected).toHaveBeenCalledWith({
        group: expect.objectContaining({ id: 'today' }),
        notification: expect.objectContaining({ id: 'candidate-shortlist' }),
      });

      await userEvent.click(canvas.getByRole('button', { name: /notification actions/i }));
      await userEvent.click(await body.findByText('Remove'));
      await expect(actionSelected).toHaveBeenCalledWith({
        action: expect.objectContaining({ id: 'remove', label: 'Remove' }),
      });
    });
  },
};
