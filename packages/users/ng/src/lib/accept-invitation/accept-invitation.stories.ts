import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { UsersService } from '@otwld/ng-users/core';
import { provideActivatedRoute } from '@otwld/ng-cdk/testing';
import {
  UserAccountStatus,
  UserInvitationStatus,
  UserOAuthProvider,
  type UserInvitationDetails,
  type UserProfile,
} from '@otwld/ts-users';
import { of } from 'rxjs';
import { AcceptInvitationPage } from './accept-invitation';

const invitationToken = 'candidate-invite-token';
const invitedCandidate: UserInvitationDetails = {
  availableProviders: ['credentials', 'google', 'github'],
  displayName: 'Ada Lovelace',
  email: 'ada.lovelace@example.com',
  expiresAt: '2026-06-18T00:00:00.000Z',
  status: UserInvitationStatus.Pending,
};

const acceptedProfile: UserProfile = {
  accountStatus: UserAccountStatus.Active,
  authUserId: 'auth-ada-lovelace',
  createdAt: '2026-06-11T00:00:00.000Z',
  displayName: 'Ada Lovelace',
  email: 'ada.lovelace@example.com',
  emailVerified: true,
  id: 'user-ada-lovelace',
  invitationStatus: UserInvitationStatus.Accepted,
  permissions: [],
  roles: [],
  updatedAt: '2026-06-11T00:00:00.000Z',
};

const getInvitation = fn(() => of({ invitation: invitedCandidate }));
const acceptCredentials = fn(() =>
  of({
    accepted: true,
    user: acceptedProfile,
  }),
);
const startOAuth = fn();

const meta: Meta<AcceptInvitationPage> = {
  argTypes: {},
  component: AcceptInvitationPage,
  decorators: [
    applicationConfig({
      providers: [
        provideActivatedRoute({
          params: {
            token: invitationToken,
          },
        }),
        {
          provide: UsersService,
          useValue: {
            acceptCredentials,
            getInvitation,
            startOAuth,
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
    template: `<usr-accept-invitation></usr-accept-invitation>`,
  }),
  title: 'users/ng/accept-invitation',
};

export default meta;

type Story = StoryObj<AcceptInvitationPage>;

/** Default Accept Invitation Page state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('load the invitation details', async () => {
      await expect(canvas.getByRole('heading', { name: /accept invitation/i })).toBeVisible();
      await expect(await canvas.findByText(/ada lovelace · ada\.lovelace@example\.com/i)).toBeVisible();
      await expect(getInvitation).toHaveBeenCalledWith(invitationToken);
    });

    await step('start Google invitation acceptance', async () => {
      startOAuth.mockClear();

      await userEvent.click(canvas.getByRole('button', { name: /continue with google/i }));
      await expect(startOAuth).toHaveBeenCalledWith(invitationToken, UserOAuthProvider.Google);
    });

    await step('accept the invitation with credentials', async () => {
      acceptCredentials.mockClear();

      await userEvent.type(canvas.getByLabelText('Username'), 'ada.lovelace');
      await userEvent.type(canvas.getByLabelText('Password'), 'candidate-match-2026');
      await userEvent.click(canvas.getByRole('button', { name: /create password/i }));

      await expect(acceptCredentials).toHaveBeenCalledWith(invitationToken, {
        password: 'candidate-match-2026',
        username: 'ada.lovelace',
      });
      await expect(await canvas.findByText(/invitation accepted/i)).toBeVisible();
    });
  },
};
