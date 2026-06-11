import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { AuthService } from '@otwld/ng-auth/core';
import { of } from 'rxjs';
import { ForgotPasswordPage } from './forgot-password';

const requestPasswordReset = fn(() => of(undefined));

const meta: Meta<ForgotPasswordPage> = {
  argTypes: {},
  component: ForgotPasswordPage,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: AuthService,
          useValue: {
            forgotPassword: requestPasswordReset,
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
    template: `<auth-forgot-password></auth-forgot-password>`,
  }),
  title: 'auth/ng/forgot-password',
};

export default meta;

type Story = StoryObj<ForgotPasswordPage>;

/** Default Forgot Password Page state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('enter the recruiter account email', async () => {
      await expect(canvas.getByText(/enter your email to reset your password/i)).toBeVisible();
      await userEvent.type(canvas.getByPlaceholderText('Email'), 'recruiter.ada@example.com');
    });

    await step('submit the reset request', async () => {
      requestPasswordReset.mockClear();

      await userEvent.click(canvas.getByRole('button', { name: /submit/i }));
      await expect(requestPasswordReset).toHaveBeenCalledWith('recruiter.ada@example.com');
      await expect(canvas.getByText(/reset link has been sent/i)).toBeVisible();
    });
  },
};
