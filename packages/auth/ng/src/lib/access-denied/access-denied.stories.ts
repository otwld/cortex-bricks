import { type Meta, type StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideStorybookLocation } from '@otwld/ng-storybook';
import { expect, fn } from 'storybook/test';
import { AccessDeniedPage } from './access-denied';

const goBack = fn();

const meta: Meta<AccessDeniedPage> = {
  argTypes: {},
  component: AccessDeniedPage,
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
    template: `<auth-access-denied></auth-access-denied>`,
  }),
  title: 'auth/ng/access-denied',
};

export default meta;

type Story = StoryObj<AccessDeniedPage>;

/** Default Access Denied Page state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('show the authorization failure', async () => {
      await expect(canvas.getByText('403')).toBeVisible();
      await expect(canvas.getByText(/access denied/i)).toBeVisible();
    });

    await step('return to the previous page', async () => {
      goBack.mockClear();

      await userEvent.click(canvas.getByRole('button', { name: /go back/i }));
      await expect(goBack).toHaveBeenCalledTimes(1);
    });
  },
};
