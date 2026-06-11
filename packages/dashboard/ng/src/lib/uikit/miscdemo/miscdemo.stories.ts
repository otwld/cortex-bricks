import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { MiscDemo } from './miscdemo';

const meta: Meta<MiscDemo> = {
  argTypes: {},
  component: MiscDemo,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-misc-demo></app-misc-demo>`,
  }),
  title: 'dashboard/ng/uikit/miscdemo',
};

export default meta;

type Story = StoryObj<MiscDemo>;

/** Default Misc Demo state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render status and content primitives', async () => {
      await expect(canvas.getByText('ProgressBar')).toBeVisible();
      await expect(canvas.getByText('Badge')).toBeVisible();
      await expect(canvas.getByText('Avatar')).toBeVisible();
      await expect(canvas.getByText('MeterGroup')).toBeVisible();
      await expect(canvas.getByText('Apps')).toBeVisible();
    });

    await step('exercise a badge button', async () => {
      const emailsButton = canvas.getByRole('button', { name: /emails/i });

      await userEvent.click(emailsButton);

      await expect(emailsButton).toBeVisible();
    });
  },
};
