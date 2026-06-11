import { type Meta, type StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideStorybookLocation } from '@otwld/ng-storybook';
import { expect, fn } from 'storybook/test';
import { ErrorPage } from './error';

const goBack = fn();

const meta: Meta<ErrorPage> = {
  argTypes: {},
  component: ErrorPage,
  decorators: [
    applicationConfig({
      providers: [
        provideStorybookLocation({ back: goBack }),
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<auth-error></auth-error>`,
  }),
  title: 'auth/ng/error',
};

export default meta;

type Story = StoryObj<ErrorPage>;

/** Default Error Page state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('show the server error state', async () => {
      await expect(canvas.getByText('500')).toBeVisible();
      await expect(canvas.getByText(/something went wrong/i)).toBeVisible();
    });

    await step('return to the previous page', async () => {
      goBack.mockClear();

      await userEvent.click(canvas.getByRole('button', { name: /go back/i }));
      await expect(goBack).toHaveBeenCalledTimes(1);
    });
  },
};
