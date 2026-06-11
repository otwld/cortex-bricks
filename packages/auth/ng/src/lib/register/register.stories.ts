import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { AuthService } from '@otwld/ng-auth/core';
import { NEVER } from 'rxjs';
import { RegisterPage } from './register';

const registerAccount = fn(() => NEVER);

const meta: Meta<RegisterPage> = {
  argTypes: {},
  component: RegisterPage,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: registerAccount,
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
    template: `<auth-register></auth-register>`,
  }),
  title: 'auth/ng/register',
};

export default meta;

type Story = StoryObj<RegisterPage>;

/** Default Register Page state. */
export const Default: Story = {
  play: async ({ canvas, canvasElement, step, userEvent }) => {
    await step('enter candidate portal account details', async () => {
      const passwordInput = canvasElement.querySelector<HTMLInputElement>('input[placeholder="Password"]');

      await userEvent.type(canvas.getByPlaceholderText('First name'), 'Ada');
      await userEvent.type(canvas.getByPlaceholderText('Last name'), 'Lovelace');
      await userEvent.type(canvas.getByPlaceholderText('Email'), 'recruiter.ada@example.com');
      await expect(passwordInput).toBeVisible();
      await userEvent.type(passwordInput!, 'candidate-match-2026');
      await userEvent.click(canvas.getByLabelText(/i accept/i));
    });

    await step('submit the registration request', async () => {
      registerAccount.mockClear();

      await userEvent.click(canvas.getByRole('button', { name: /sign up/i }));
      await expect(registerAccount).toHaveBeenCalledWith({
        email: 'recruiter.ada@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        password: 'candidate-match-2026',
      });
    });
  },
};
