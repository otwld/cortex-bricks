import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { createJsonGetHandler, withStoryMswHandlers } from '@otwld/ng-storybook';
import { ChatMenu } from './chat-menu';

const selectChatEvent = fn();
const newChatEvent = fn();

const chatRooms = [
  {
    id: 1,
    name: 'Design Team',
    type: 'group',
    archived: false,
    pinned: true,
    participants: [
      { id: 1, name: 'Amy Elsner', avatar: 'amyelsner.png', status: 'online' },
      { id: 2, name: 'Anna Fali', avatar: 'annafali.png', status: 'online' },
    ],
    unreadCount: 3,
    messages: [
      {
        id: 1,
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
    participants: [
      { id: 3, name: 'Ada Lovelace', status: 'online' },
      { id: 4, name: 'Grace Hopper', status: 'away' },
    ],
    messages: [
      {
        id: 2,
        senderId: 'me',
        senderName: 'You',
        content: 'The candidate shortlist is ready.',
        timestamp: '2026-06-11T10:15:00.000Z',
        time: '10:15 AM',
        type: 'text',
      },
    ],
  },
  {
    id: 3,
    name: 'Isabella Andolini',
    type: 'individual',
    archived: true,
    messages: [
      {
        id: 3,
        senderId: 5,
        senderName: 'Isabella Andolini',
        content: 'I uploaded the updated profile.',
        timestamp: '2026-06-10T16:45:00.000Z',
        time: '4:45 PM',
        type: 'text',
      },
    ],
  },
];

const chatData = {
  userData: {
    5: {
      id: 5,
      name: 'Isabella Andolini',
      company: 'Northstar Talent',
      role: 'Recruiting Lead',
      status: 'active',
    },
  },
};

const meta: Meta<ChatMenu> = {
  argTypes: {
    activeChatId: {
      control: 'number',
      description: 'Currently active chat room id.',
      table: { category: 'Inputs' },
    },
    chatRooms: {
      control: 'object',
      description: 'Chat rooms available to the menu.',
      table: { category: 'Inputs' },
    },
    newChatEvent: {
      action: 'newChatEvent',
      description: 'Emitted when a contact without an existing room is selected.',
      table: { category: 'Outputs' },
    },
    selectChatEvent: {
      action: 'selectChatEvent',
      description: 'Emitted when an existing chat room is selected.',
      table: { category: 'Outputs' },
    },
  },
  args: {
    activeChatId: 1,
    chatRooms,
    newChatEvent,
    selectChatEvent,
  },
  component: ChatMenu,
  render: (args) => ({
    props: args,
    template: `
      <app-chat-menu
        [chatRooms]="chatRooms"
        [activeChatId]="activeChatId"
        (selectChatEvent)="selectChatEvent($event)"
        (newChatEvent)="newChatEvent($event)"
      />
    `,
  }),
  title: 'dashboard/ng/apps/chat/chat-menu',
};

export default meta;

type Story = StoryObj<ChatMenu>;

/** Default Chat Menu state. */
export const Default: Story = {
  parameters: {
    ...withStoryMswHandlers({
      chatData: [createJsonGetHandler('/demo/data/chatData.json', chatData)],
    }),
  },
  play: async ({ canvas, step, userEvent }) => {
    await step('render searchable chat groups and archive tab', async () => {
      await expect(canvas.getByText('Online')).toBeVisible();
      await expect(canvas.getByText('Pinned')).toBeVisible();
      await expect(canvas.getAllByText('Design Team')[0]).toBeVisible();
      await expect(canvas.getByRole('button', { name: /archived/i })).toBeVisible();
    });

    await step('filter the chat list through the search control', async () => {
      await userEvent.type(canvas.getByPlaceholderText('Search'), 'Recruiting');

      await expect(canvas.getByText('Recruiting Ops')).toBeVisible();
      await expect(canvas.queryAllByText('Design Team')).toHaveLength(0);
    });

    await step('emit the selected chat id', async () => {
      selectChatEvent.mockClear();

      await userEvent.click(canvas.getByText('Recruiting Ops'));

      await expect(selectChatEvent).toHaveBeenCalledWith(2);
    });
  },
};
