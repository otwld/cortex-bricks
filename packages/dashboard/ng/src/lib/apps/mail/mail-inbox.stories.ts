import { ActivatedRoute, Router } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn, within } from 'storybook/test';
import { createJsonGetHandler, withStoryMswHandlers } from '@otwld/ng-storybook';
import { MailInbox } from './mail-inbox';

const navigate = fn();

const emailData = {
  categoryItems: [
    { icon: 'pi pi-tag', label: 'Updates' },
    { icon: 'pi pi-users', label: 'Social' },
  ],
  emails: [
    {
      archived: false,
      avatar: '/demo/images/avatar/avatar-square-f-1.jpg',
      category: 'Updates',
      deleted: false,
      email: 'brook.simmons@example.com',
      id: 1,
      important: true,
      preview: 'Please review and complete the account security steps.',
      read: false,
      sender: 'Brook Simmons',
      spam: false,
      starred: true,
      subject: 'Important Account Update',
      tag: 'Security',
      thread: [],
      time: '3:24 PM',
    },
    {
      archived: false,
      avatar: '/demo/images/avatar/avatar-square-f-2.jpg',
      category: 'Updates',
      deleted: false,
      email: 'dianne.russell@company.com',
      id: 2,
      important: true,
      preview: 'Attached is the weekly project update.',
      read: false,
      sender: 'Dianne Russell',
      spam: false,
      starred: false,
      subject: 'Weekly Project Update',
      tag: 'Update',
      thread: [],
      time: '11:24 AM',
    },
    {
      archived: false,
      avatar: 'CW',
      category: 'Social',
      deleted: false,
      email: 'cameron.watson@hr.com',
      id: 3,
      important: false,
      preview: 'Mark your calendar for the event.',
      read: true,
      sender: 'Cameron Watson',
      spam: false,
      starred: false,
      subject: 'Employee Appreciation Event',
      tag: 'HR',
      thread: [],
      time: 'Jan 15',
    },
  ],
  menuItems: [
    { icon: 'pi pi-inbox', label: 'Inbox' },
    { icon: 'pi pi-star', label: 'Starred' },
    { icon: 'pi pi-bookmark', label: 'Important' },
    { icon: 'pi pi-send', label: 'Sent' },
    { icon: 'pi pi-inbox', label: 'Archived' },
    { icon: 'pi pi-ban', label: 'Spam' },
    { icon: 'pi pi-trash', label: 'Trash' },
  ],
};

const meta: Meta<MailInbox> = {
  argTypes: {},
  component: MailInbox,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {},
            },
          },
        },
        {
          provide: Router,
          useValue: {
            navigate,
          },
        },
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-mail-inbox></app-mail-inbox>`,
  }),
  title: 'dashboard/ng/apps/mail/mail-inbox',
};

export default meta;

type Story = StoryObj<MailInbox>;

/** Default Mail Inbox state. */
export const Default: Story = {
  parameters: {
    ...withStoryMswHandlers({
      emailData: [createJsonGetHandler('/demo/data/emailData.json', emailData)],
    }),
  },
  play: async ({ canvas, canvasElement, step, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await step('render inbox folders and messages', async () => {
      await expect(await canvas.findByText('Mails')).toBeVisible();
      await expect(canvas.getByText('Brook Simmons')).toBeVisible();
      await expect(canvas.getByText('Important Account Update')).toBeVisible();
    });

    await step('filter messages through search', async () => {
      await userEvent.type(canvas.getByPlaceholderText('Search mail'), 'Dianne');

      await expect(canvas.getByText('Dianne Russell')).toBeVisible();
      await expect(canvas.queryByText('Brook Simmons')).not.toBeInTheDocument();
    });

    await step('open the compose dialog', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /compose new/i }));

      await expect(await body.findByText('Compose')).toBeVisible();
      await expect(body.getByLabelText('To:')).toBeVisible();
    });
  },
};
