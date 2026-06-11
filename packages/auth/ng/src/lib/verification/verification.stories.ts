import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { AuthService } from '@otwld/ng-auth/core';
import { NEVER, of } from 'rxjs';
import { VerificationPage } from './verification';

const resendVerification = fn(() => of(undefined));
const verifyEmail = fn(() => NEVER);

const meta: Meta<VerificationPage> = {
  argTypes: {},
  component: VerificationPage,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: AuthService,
          useValue: {
            resendVerification,
            verifyEmail,
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
    template: `<auth-verification></auth-verification>`,
  }),
  title: 'auth/ng/verification',
};

export default meta;

type Story = StoryObj<VerificationPage>;

/** Default Verification Page state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('request a fresh verification code', async () => {
      resendVerification.mockClear();

      await userEvent.click(canvas.getByRole('button', { name: /resend/i }));
      await expect(resendVerification).toHaveBeenCalledTimes(1);
    });

    await step('submit the recruiter verification code', async () => {
      verifyEmail.mockClear();

      await userEvent.type(canvas.getByPlaceholderText('------'), '123456');
      await userEvent.click(canvas.getByRole('button', { name: /verify/i }));
      await expect(verifyEmail).toHaveBeenCalledWith('123456');
    });
  },
};
