import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { AUTH_CONFIG, AuthService } from '@otwld/ng-auth/core';
import type { AuthUser } from '@otwld/ts-auth';
import { NEVER, of } from 'rxjs';
import { LoginPage } from './login';

const recruiterUser: AuthUser = {
  _id: 'user-recruiter-ada',
  email: 'recruiter.ada@example.com',
  emailVerified: true,
  firstName: 'Ada',
  lastName: 'Lovelace',
  permissions: [],
  roles: [],
};

const login = fn(() => NEVER);
const developmentLogin = fn(() => of(recruiterUser));
const loginWithGoogle = fn();
const loginWithGithub = fn();

const meta: Meta<LoginPage> = {
  argTypes: {},
  component: LoginPage,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: AUTH_CONFIG,
          useValue: {
            afterLoginRoute: '/dashboard',
            apiUrl: '/api/auth',
            devLoginEnabled: true,
          },
        },
        {
          provide: AuthService,
          useValue: {
            devLogin: developmentLogin,
            login,
            loginWithGithub,
            loginWithGoogle,
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
    template: `<auth-login></auth-login>`,
  }),
  title: 'auth/ng/login',
};

export default meta;

type Story = StoryObj<LoginPage>;

/** Default Login Page state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('start the Google sign-in action', async () => {
      loginWithGoogle.mockClear();

      await userEvent.click(canvas.getByRole('button', { name: /google/i }));
      await expect(loginWithGoogle).toHaveBeenCalledTimes(1);
    });

    await step('submit recruiter credentials', async () => {
      login.mockClear();

      await userEvent.type(canvas.getByPlaceholderText('Email'), 'recruiter.ada@example.com');
      await userEvent.type(canvas.getByPlaceholderText('Password'), 'candidate-match-2026');
      await userEvent.click(canvas.getByRole('button', { name: /^log in$/i }));

      await expect(login).toHaveBeenCalledWith('recruiter.ada@example.com', 'candidate-match-2026');
    });
  },
};
