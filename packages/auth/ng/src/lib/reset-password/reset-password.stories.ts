import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { AuthService } from '@otwld/ng-auth/core';
import { provideActivatedRoute } from '@otwld/ng-cdk/testing';
import { NEVER } from 'rxjs';
import { ResetPasswordPage } from './reset-password';

const resetPassword = fn(() => NEVER);

const meta: Meta<ResetPasswordPage> = {
  argTypes: {},
  component: ResetPasswordPage,
  decorators: [
    applicationConfig({
      providers: [
        provideActivatedRoute({
          queryParams: {
            token: 'candidate-reset-token',
          },
        }),
        {
          provide: AuthService,
          useValue: {
            resetPassword,
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
    template: `<auth-reset-password></auth-reset-password>`,
  }),
  title: 'auth/ng/reset-password',
};

export default meta;

type Story = StoryObj<ResetPasswordPage>;

/** Default Reset Password Page state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('enter matching replacement passwords', async () => {
      await expect(canvas.getByText(/enter your new password/i)).toBeVisible();
      await userEvent.type(canvas.getByPlaceholderText('Password'), 'candidate-match-2026');
      await userEvent.type(canvas.getByPlaceholderText('Repeat Password'), 'candidate-match-2026');
    });

    await step('submit the token-backed password reset', async () => {
      resetPassword.mockClear();

      await userEvent.click(canvas.getByRole('button', { name: /submit/i }));
      await expect(resetPassword).toHaveBeenCalledWith('candidate-reset-token', 'candidate-match-2026');
    });
  },
};
