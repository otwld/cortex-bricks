import { provideStorybookRouter } from '@otwld/ng-storybook';
import { UsersService } from '@otwld/ng-users/core';
import { UserAccountStatus, UserInvitationStatus, type UserProfileResponse } from '@otwld/ts-users';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, fn } from 'storybook/test';
import { FormStateService } from '../../form-state.service';
import { AccountStatus } from './account-status';

const navigate = fn();
const createUser = fn<() => ReturnType<typeof of<UserProfileResponse>>>(() =>
  of({
    invitation: {
      deliveryStatus: 'not-requested',
      expiresAt: '2026-06-20T00:00:00.000Z',
      link: '/accept-invitation/aisha-candidate-token',
    },
    user: {
      accountStatus: UserAccountStatus.Active,
      authUserId: 'auth-aisha-patel',
      createdAt: '2026-06-11T00:00:00.000Z',
      displayName: 'Aisha Patel',
      email: 'aisha.patel@example.com',
      emailVerified: false,
      id: 'user-aisha-patel',
      invitationStatus: UserInvitationStatus.Pending,
      permissions: [],
      roles: [{ name: 'member', permissions: [] }],
      updatedAt: '2026-06-11T00:00:00.000Z',
    },
  }),
);

function createSeededFormStateService(): FormStateService {
  const service = new FormStateService();
  service.updateField('firstName', 'Aisha');
  service.updateField('lastName', 'Patel');
  service.updateField('displayName', 'Aisha Patel');
  service.updateField('email', 'aisha.patel@example.com');
  service.updateField('position', 'Senior Angular Engineer');
  return service;
}

const meta: Meta<AccountStatus> = {
  argTypes: {},
  component: AccountStatus,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: FormStateService,
          useFactory: createSeededFormStateService,
        },
        provideStorybookRouter({ navigate }),
        {
          provide: UsersService,
          useValue: { create: createUser },
        },
      ],
    }),
  ],
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-account-status></app-account-status>`,
  }),
  title: 'dashboard/ng/user-management/steps/account-status',
};

export default meta;

type Story = StoryObj<AccountStatus>;

/** Default Account Status state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    navigate.mockClear();
    createUser.mockClear();

    await step('render final account settings', async () => {
      await expect(canvas.getAllByText('Account Status')[0]).toBeVisible();
      await expect(canvas.getByLabelText('Create invitation')).toBeChecked();
      await expect(canvas.getByRole('button', { name: /save/i })).toBeVisible();
    });

    await step('create the seeded candidate user', async () => {
      await userEvent.type(canvas.getByRole('textbox'), 'Reviewed by recruitment operations.');
      await userEvent.click(canvas.getByRole('button', { name: /save/i }));

      await expect(createUser).toHaveBeenCalled();
      await expect(canvas.getByText('User created')).toBeVisible();
      await expect(canvas.getByText(/aisha.patel@example.com/i)).toBeVisible();
      await expect(canvas.getByRole('button', { name: /copy link/i })).toBeVisible();
    });
  },
};
