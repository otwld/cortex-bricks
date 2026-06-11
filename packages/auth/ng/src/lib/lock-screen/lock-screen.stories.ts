import { signal } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { AUTH_CONFIG, AuthService, AuthStateService } from '@otwld/ng-auth/core';
import { provideStorybookRouter } from '@otwld/ng-storybook';
import type { AuthUser } from '@otwld/ts-auth';
import { of } from 'rxjs';
import { LockScreenPage } from './lock-screen';

const recruiterUser: AuthUser = {
  _id: 'user-recruiter-ada',
  email: 'recruiter.ada@example.com',
  emailVerified: true,
  firstName: 'Ada',
  lastName: 'Lovelace',
  permissions: [],
  roles: [],
};

const unlockSession = fn(() => of(recruiterUser));
const navigateByUrl = fn();
const currentUser = signal<AuthUser | null>(recruiterUser);
const displayName = signal('Ada');

const meta: Meta<LockScreenPage> = {
  argTypes: {},
  component: LockScreenPage,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: AUTH_CONFIG,
          useValue: {
            afterLoginRoute: '/dashboard',
            apiUrl: '/api/auth',
          },
        },
        {
          provide: AuthService,
          useValue: {
            login: unlockSession,
          },
        },
        {
          provide: AuthStateService,
          useValue: {
            displayName,
            user: currentUser.asReadonly(),
          },
        },
        provideStorybookRouter({ navigateByUrl }),
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<auth-lock-screen></auth-lock-screen>`,
  }),
  title: 'auth/ng/lock-screen',
};

export default meta;

type Story = StoryObj<LockScreenPage>;

/** Default Lock Screen Page state. */
export const Default: Story = {
  play: async ({ canvas, canvasElement, step, userEvent }) => {
    await step('show the current recruiter identity', async () => {
      await expect(canvas.getByText('Ada')).toBeVisible();
      await expect(canvas.getByText(/enter your password to continue/i)).toBeVisible();
    });

    await step('unlock with the current recruiter password', async () => {
      unlockSession.mockClear();
      navigateByUrl.mockClear();

      const passwordInput = canvasElement.querySelector<HTMLInputElement>('input[placeholder="Password"]');
      await expect(passwordInput).toBeVisible();

      await userEvent.type(passwordInput!, 'candidate-match-2026');
      await userEvent.click(canvas.getByRole('button', { name: /unlock/i }));

      await expect(unlockSession).toHaveBeenCalledWith('recruiter.ada@example.com', 'candidate-match-2026');
      await expect(navigateByUrl).toHaveBeenCalledWith('/dashboard');
    });
  },
};
