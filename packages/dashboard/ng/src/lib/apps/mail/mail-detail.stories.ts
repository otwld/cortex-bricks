import { ActivatedRoute } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { createJsonGetHandler, provideStorybookRouter, withStoryMswHandlers } from '@otwld/ng-storybook';
import { MailDetail } from './mail-detail';

const navigate = fn();

const emailData = {
  emails: [
    {
      archived: false,
      avatar: '/demo/images/avatar/avatar-square-f-1.jpg',
      category: 'Updates',
      deleted: false,
      email: 'brook.simmons@example.com',
      fullContent: '<p>Please review and complete the account security steps.</p>',
      id: 1,
      important: true,
      preview: 'Please review and complete the account security steps.',
      read: false,
      sender: 'Brook Simmons',
      spam: false,
      starred: true,
      subject: 'Important Account Update',
      tag: 'Security',
      thread: [
        {
          avatar: '/demo/images/avatar/avatar-square-f-1.jpg',
          content: 'Please review and complete the account security steps.',
          email: 'brook.simmons@example.com',
          id: 1,
          sender: 'Brook Simmons',
          time: 'Jun 02 2026 15:24',
        },
      ],
      time: '3:24 PM',
    },
  ],
};

const meta: Meta<MailDetail> = {
  argTypes: {},
  component: MailDetail,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: { id: '1' },
              queryParams: { from: 'Inbox' },
            },
          },
        },
        provideStorybookRouter({ navigate }),
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-mail-detail></app-mail-detail>`,
  }),
  title: 'dashboard/ng/apps/mail/mail-detail',
};

export default meta;

type Story = StoryObj<MailDetail>;

/** Default Mail Detail state. */
export const Default: Story = {
  parameters: {
    ...withStoryMswHandlers({
      emailData: [createJsonGetHandler('/demo/data/emailData.json', emailData)],
    }),
  },
  play: async ({ canvas, step, userEvent }) => {
    await step('render loaded email thread', async () => {
      await expect(await canvas.findByRole('heading', { name: /important account update/i })).toBeVisible();
      await expect(canvas.getAllByText('Brook Simmons')[0]).toBeInTheDocument();
      await expect(canvas.getByText(/account security steps/i)).toBeVisible();
    });

    await step('compose and send a reply', async () => {
      await userEvent.click(canvas.getAllByRole('button', { name: /reply/i })[0]);
      await userEvent.type(await canvas.findByPlaceholderText('Type your reply...'), 'The security checklist is complete.');
      await userEvent.click(canvas.getByRole('button', { name: /send/i }));

      await expect(canvas.queryByPlaceholderText('Type your reply...')).not.toBeInTheDocument();
    });
  },
};
