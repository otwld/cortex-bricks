import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { UsersService } from '@otwld/ng-users/core';
import { provideActivatedRoute } from '@otwld/ng-cdk/testing';
import { UserAccountStatus, UserInvitationStatus, type UserProfile } from '@otwld/ts-users';
import { of } from 'rxjs';
import { OAuthCompletePage } from './oauth-complete';

const oauthState = 'candidate-oauth-state';
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

const completeOAuthState = fn(() =>
  of({
    accepted: true,
    user: acceptedProfile,
  }),
);

const meta: Meta<OAuthCompletePage> = {
  argTypes: {},
  component: OAuthCompletePage,
  decorators: [
    applicationConfig({
      providers: [
        provideActivatedRoute({
          queryParams: {
            state: oauthState,
          },
        }),
        {
          provide: UsersService,
          useValue: {
            completeOAuthState,
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
    template: `<usr-oauth-complete></usr-oauth-complete>`,
  }),
  title: 'users/ng/oauth-complete',
};

export default meta;

type Story = StoryObj<OAuthCompletePage>;

/** Default OAuth Complete Page state. */
export const Default: Story = {
  play: async ({ canvas, step }) => {
    await step('complete invitation acceptance from OAuth state', async () => {
      await expect(canvas.getByRole('heading', { name: /completing invitation/i })).toBeVisible();
      await expect(completeOAuthState).toHaveBeenCalledWith(oauthState);
      await expect(await canvas.findByText('Invitation accepted.')).toBeVisible();
      await expect(canvas.getByRole('link', { name: /continue to dashboard/i })).toBeVisible();
    });
  },
};
