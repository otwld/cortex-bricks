import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { ChatBox } from './chatbox';

const openUserProfileEvent = fn();
const sendMessageEvent = fn();

const activeChat = {
  id: 1,
  name: 'Design Team',
  type: 'group',
  participants: [{ id: 2, name: 'Anna Fali', avatar: 'annafali.png', status: 'online' }],
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
      isNewDay: true,
      dateLabel: '11 June 2026',
    },
    {
      id: 2,
      senderId: 'me',
      senderName: 'You',
      content: 'Yes, I will send the candidate notes first.',
      timestamp: '2026-06-11T09:34:00.000Z',
      time: '9:34 AM',
      type: 'text',
    },
  ],
};

const meta: Meta<ChatBox> = {
  argTypes: {
    activeChat: {
      control: 'object',
      description: 'Active chat room and its rendered messages.',
      table: { category: 'Inputs' },
    },
    currentUser: {
      control: 'object',
      description: 'Current chat user used for new outgoing messages.',
      table: { category: 'Inputs' },
    },
    openUserProfileEvent: {
      action: 'openUserProfileEvent',
      description: 'Emitted when a message sender profile is opened.',
      table: { category: 'Outputs' },
    },
    sendMessageEvent: {
      action: 'sendMessageEvent',
      description: 'Emitted with the composed text message.',
      table: { category: 'Outputs' },
    },
  },
  args: {
    activeChat,
    currentUser: {
      id: 'me',
      name: 'You',
    },
    openUserProfileEvent,
    sendMessageEvent,
  },
  component: ChatBox,
  render: (args) => ({
    props: args,
    template: `
      <app-chat-box
        [activeChat]="activeChat"
        [currentUser]="currentUser"
        (openUserProfileEvent)="openUserProfileEvent($event)"
        (sendMessageEvent)="sendMessageEvent($event)"
      />
    `,
  }),
  title: 'dashboard/ng/apps/chat/chatbox',
};

export default meta;

type Story = StoryObj<ChatBox>;

/** Default Chat Box state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render the active conversation', async () => {
      await expect(canvas.getByText('11 June 2026')).toBeVisible();
      await expect(canvas.getByText('Can we schedule a review session tomorrow?')).toBeVisible();
      await expect(canvas.getByText('Yes, I will send the candidate notes first.')).toBeVisible();
    });

    await step('emit a composed message action', async () => {
      sendMessageEvent.mockClear();

      await userEvent.type(canvas.getByPlaceholderText('Write a message'), 'The profile packet is ready.');
      await userEvent.click(canvas.getByRole('button', { name: /send/i }));

      await expect(sendMessageEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'The profile packet is ready.',
          senderId: 'me',
          senderName: 'You',
          type: 'text',
        }),
      );
    });
  },
};
