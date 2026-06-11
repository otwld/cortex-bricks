import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { ChatSidebar } from './chatsidebar';

const closeUserProfileEvent = fn();
const openUserProfileEvent = fn();
const toggleContactInfoEvent = fn();

const activeChat = {
  id: 1,
  name: 'Design Team',
  type: 'group',
  participants: [
    { id: 1, name: 'Amy Elsner', avatar: 'amyelsner.png', status: 'online' },
    { id: 2, name: 'Anna Fali', avatar: 'annafali.png', status: 'away' },
  ],
  messages: [],
};

const selectedUser = {
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
  linkedThreads: ['Design Team', 'Recruiting Ops'],
};

const meta: Meta<ChatSidebar> = {
  argTypes: {
    activeChat: {
      control: 'object',
      description: 'Chat room whose participants are listed in group info.',
      table: { category: 'Inputs' },
    },
    closeUserProfileEvent: {
      action: 'closeUserProfileEvent',
      description: 'Emitted when the user profile pane closes.',
      table: { category: 'Outputs' },
    },
    openUserProfileEvent: {
      action: 'openUserProfileEvent',
      description: 'Emitted when a participant profile opens.',
      table: { category: 'Outputs' },
    },
    selectedUser: {
      control: 'object',
      description: 'Selected user profile data.',
      table: { category: 'Inputs' },
    },
    showContactInfo: {
      control: 'boolean',
      description: 'Whether group contact info is visible.',
      table: { category: 'Inputs' },
    },
    showUserProfile: {
      control: 'boolean',
      description: 'Whether the selected user profile is visible.',
      table: { category: 'Inputs' },
    },
    toggleContactInfoEvent: {
      action: 'toggleContactInfoEvent',
      description: 'Emitted when contact info visibility toggles.',
      table: { category: 'Outputs' },
    },
  },
  args: {
    activeChat,
    closeUserProfileEvent,
    openUserProfileEvent,
    selectedUser,
    showContactInfo: true,
    showUserProfile: false,
    toggleContactInfoEvent,
  },
  component: ChatSidebar,
  render: (args) => ({
    props: args,
    template: `
      <app-chat-sidebar
        [activeChat]="activeChat"
        [selectedUser]="selectedUser"
        [showContactInfo]="showContactInfo"
        [showUserProfile]="showUserProfile"
        (openUserProfileEvent)="openUserProfileEvent($event)"
        (closeUserProfileEvent)="closeUserProfileEvent()"
        (toggleContactInfoEvent)="toggleContactInfoEvent()"
      />
    `,
  }),
  title: 'dashboard/ng/apps/chat/chatsidebar',
};

export default meta;

type Story = StoryObj<ChatSidebar>;

/** Default Chat Sidebar state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render group info participants', async () => {
      await expect(canvas.getByText('Group Info')).toBeVisible();
      await expect(canvas.getByText('Amy Elsner')).toBeVisible();
      await expect(canvas.getByText('Anna Fali')).toBeVisible();
    });

    await step('emit the close contact info action', async () => {
      toggleContactInfoEvent.mockClear();

      await userEvent.click(canvas.getAllByRole('button')[0]);

      await expect(toggleContactInfoEvent).toHaveBeenCalledTimes(1);
    });
  },
};

/** Selected user profile panel. */
export const UserProfile: Story = {
  args: {
    showContactInfo: false,
    showUserProfile: true,
  },
  play: async ({ canvas, step, userEvent }) => {
    await step('render selected user profile details', async () => {
      await expect(canvas.getByText('Amy Elsner')).toBeVisible();
      await expect(canvas.getByText('Northstar Talent')).toBeVisible();
      await expect(canvas.getByText('amy.elsner@example.com')).toBeVisible();
      await expect(canvas.getByText('Linked threads')).toBeVisible();
    });

    await step('emit close user profile action', async () => {
      closeUserProfileEvent.mockClear();

      await userEvent.click(canvas.getAllByRole('button')[0]);

      await expect(closeUserProfileEvent).toHaveBeenCalledTimes(1);
    });
  },
};
