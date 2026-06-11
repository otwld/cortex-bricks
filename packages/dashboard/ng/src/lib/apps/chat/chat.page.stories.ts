import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { createJsonGetHandler, withStoryMswHandlers } from '@otwld/ng-storybook';
import { ChatPage } from './chat.page';

const chatData = {
  chatRooms: [
    {
      id: 1,
      name: 'Design Team',
      type: 'group',
      avatar: 'figma-seeklogo 1.svg',
      archived: false,
      pinned: true,
      participants: [
        { id: 1, name: 'Amy Elsner', avatar: 'amyelsner.png', status: 'online' },
        { id: 2, name: 'Anna Fali', avatar: 'annafali.png', status: 'online' },
        { id: 3, name: 'Asiya Javayant', avatar: 'asiyajavayant.png', status: 'away' },
      ],
      unreadCount: 3,
      messages: [
        {
          id: 1,
          senderId: 'me',
          senderName: 'You',
          content: 'Is this design user-friendly and modern?',
          timestamp: '2026-06-11T09:25:00.000Z',
          time: '9:25 AM',
          type: 'text',
        },
        {
          id: 2,
          senderId: 2,
          senderName: 'Anna Fali',
          senderAvatar: 'annafali.png',
          content: 'Can we schedule a review session tomorrow?',
          timestamp: '2026-06-11T09:30:00.000Z',
          time: '9:30 AM',
          type: 'text',
        },
      ],
    },
    {
      id: 2,
      name: 'Recruiting Ops',
      type: 'group',
      archived: false,
      participants: [{ id: 4, name: 'Grace Hopper', status: 'online' }],
      messages: [
        {
          id: 3,
          senderId: 4,
          senderName: 'Grace Hopper',
          content: 'The candidate shortlist is ready.',
          timestamp: '2026-06-11T10:15:00.000Z',
          time: '10:15 AM',
          type: 'text',
        },
      ],
    },
  ],
  currentUser: {
    id: 'me',
    name: 'You',
  },
  userData: {
    1: {
      id: 1,
      name: 'Amy Elsner',
      company: 'Northstar Talent',
      role: 'Design Partner',
      phone: '+1 555 0101',
      email: 'amy.elsner@example.com',
      firstContact: 'Jan 12, 2026',
      createdBy: 'Ada Lovelace',
      statusTag: 'Active',
      access: 'Member',
      linkedThreads: ['Design Team'],
    },
  },
};

const meta: Meta<ChatPage> = {
  argTypes: {},
  component: ChatPage,
  parameters: {
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-chat></app-chat>`,
  }),
  title: 'dashboard/ng/apps/chat',
};

export default meta;

type Story = StoryObj<ChatPage>;

/** Default Chat Page state. */
export const Default: Story = {
  parameters: {
    ...withStoryMswHandlers({
      chatData: [createJsonGetHandler('/demo/data/chatData.json', chatData)],
    }),
  },
  play: async ({ canvas, step, userEvent }) => {
    await step('render loaded chat conversations', async () => {
      await expect(await canvas.findByText('Design Team')).toBeVisible();
      await expect(canvas.getByText('Recruiting Ops')).toBeVisible();
      await expect(canvas.getByText('Can we schedule a review session tomorrow?')).toBeVisible();
    });

    await step('send a message in the active chat', async () => {
      await userEvent.type(canvas.getByPlaceholderText('Write a message'), 'I added the final notes.');
      await userEvent.click(canvas.getByRole('button', { name: /send/i }));

      await expect(await canvas.findByText('I added the final notes.')).toBeVisible();
    });
  },
};
