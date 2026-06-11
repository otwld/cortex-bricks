import { provideStorybookRouter } from '@otwld/ng-storybook';
import { SignedUrlCacheService } from '@otwld/ng-storage';
import { UsersService } from '@otwld/ng-users/core';
import { UserAccountStatus, UserInvitationStatus, type UserListItem, type UserProfileResponse } from '@otwld/ts-users';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, fn } from 'storybook/test';
import { UserListPage } from './user-list.page';

const navigate = fn();
const candidateUsers: UserListItem[] = [
  {
    accountStatus: UserAccountStatus.Active,
    authUserId: 'auth-aisha-patel',
    avatar: '',
    createdAt: '2026-06-01T00:00:00.000Z',
    department: 'Engineering',
    displayName: 'Aisha Patel',
    email: 'aisha.patel@example.com',
    emailVerified: false,
    firstName: 'Aisha',
    id: 'user-aisha-patel',
    invitationStatus: UserInvitationStatus.Pending,
    lastLoginAt: undefined,
    lastName: 'Patel',
    permissions: ['read:Dashboard'],
    position: 'Senior Angular Engineer',
    roles: [{ name: 'candidate-reviewer', permissions: ['read:Dashboard'] }],
    updatedAt: '2026-06-10T00:00:00.000Z',
    username: 'aisha.patel',
  },
  {
    accountStatus: UserAccountStatus.Inactive,
    authUserId: 'auth-marco-silva',
    avatar: '',
    createdAt: '2026-05-20T00:00:00.000Z',
    department: 'Recruiting',
    displayName: 'Marco Silva',
    email: 'marco.silva@example.com',
    emailVerified: true,
    firstName: 'Marco',
    id: 'user-marco-silva',
    invitationStatus: UserInvitationStatus.Accepted,
    lastLoginAt: '2026-06-09T10:00:00.000Z',
    lastName: 'Silva',
    permissions: [],
    position: 'Recruiter',
    roles: [{ name: 'recruiter', permissions: [] }],
    updatedAt: '2026-06-09T10:00:00.000Z',
    username: 'marco.silva',
  },
];

const resendInvitation = fn<() => ReturnType<typeof of<UserProfileResponse>>>(() =>
  of({
    invitation: {
      deliveryStatus: 'not-requested',
      expiresAt: '2026-06-20T00:00:00.000Z',
      link: '/accept-invitation/aisha-candidate-token',
    },
    user: {
      ...candidateUsers[0],
      invitationStatus: UserInvitationStatus.Pending,
    },
  }),
);
const deleteUser = fn<() => ReturnType<typeof of<UserProfileResponse>>>(() =>
  of({
    user: {
      ...candidateUsers[0],
      accountStatus: UserAccountStatus.Inactive,
    },
  }),
);

const meta: Meta<UserListPage> = {
  argTypes: {},
  component: UserListPage,
  decorators: [
    applicationConfig({
      providers: [
        provideStorybookRouter({ navigate }),
        {
          provide: UsersService,
          useValue: {
            delete: deleteUser,
            list: () => of({ users: candidateUsers }),
            resendInvitation,
          },
        },
        {
          provide: SignedUrlCacheService,
          useValue: { get: () => of('') },
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
    template: `<app-user-list-page></app-user-list-page>`,
  }),
  title: 'dashboard/ng/pages/user-management/user-list',
};

export default meta;

type Story = StoryObj<UserListPage>;

/** Default User List Page state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    navigate.mockClear();

    await step('render loaded users', async () => {
      await expect(await canvas.findByText('Aisha Patel')).toBeVisible();
      await expect(canvas.getByText('aisha.patel@example.com')).toBeVisible();
      await expect(canvas.getByText('Recruiter')).toBeVisible();
    });

    await step('filter the table by candidate name', async () => {
      await userEvent.type(canvas.getByPlaceholderText('Search'), 'Aisha');

      await expect(canvas.getByText('Aisha Patel')).toBeVisible();
    });

    await step('start the create-user workflow', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /add new/i }));

      await expect(navigate).toHaveBeenCalledWith(['/dashboard/profile/create/basic-information']);
    });
  },
};
