import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { type BankingHeaderAction, type BankingHeaderProfile, HeaderWidget } from './header-widget';

const actionSelected = fn();

const profile: BankingHeaderProfile = {
  name: 'Isabel',
  avatarUrl: '/demo/images/avatar/circle/avatar-f-1.png',
  avatarAlt: 'Isabel avatar',
  lastLoginLabel: 'Last recruiter login was on 06/11/2026 at 10:24 am',
};

const actions: readonly BankingHeaderAction[] = [
  { id: 'exchange', label: 'Exchange', icon: 'pi pi-arrows-h', outlined: true },
  { id: 'withdraw', label: 'Withdraw', icon: 'pi pi-download', outlined: true },
  { id: 'send', label: 'Send', icon: 'pi pi-send' },
];

const meta: Meta<HeaderWidget> = {
  argTypes: {
    actionSelected: {
      action: 'actionSelected',
      description: 'Emitted when a banking header action is selected.',
      table: { category: 'Outputs' },
    },
    actions: {
      control: 'object',
      description: 'Quick actions rendered as icon buttons.',
      table: { category: 'Inputs' },
    },
    profile: {
      control: 'object',
      description: 'Profile summary rendered in the dashboard header.',
      table: { category: 'Inputs' },
    },
  },
  args: {
    actionSelected,
    actions,
    profile,
  },
  component: HeaderWidget,
  render: (args) => ({
    props: args,
    template: `
      <app-header-widget
        [profile]="profile"
        [actions]="actions"
        (actionSelected)="actionSelected($event)"
      />
    `,
  }),
  title: 'dashboard/ng/banking/header-widget',
};

export default meta;

type Story = StoryObj<HeaderWidget>;

/** Default Header Widget state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render profile and quick actions', async () => {
      await expect(canvas.getByText('Welcome Isabel')).toBeVisible();
      await expect(canvas.getByText('Last recruiter login was on 06/11/2026 at 10:24 am')).toBeVisible();
      await expect(canvas.getByRole('img', { name: /isabel avatar/i })).toBeVisible();
      await expect(canvas.getByRole('button', { name: /send/i })).toBeVisible();
    });

    await step('emit the selected header action', async () => {
      actionSelected.mockClear();

      await userEvent.click(canvas.getByRole('button', { name: /send/i }));

      await expect(actionSelected).toHaveBeenCalledWith({
        action: expect.objectContaining({ id: 'send', label: 'Send' }),
      });
    });
  },
};
