import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { MessagesDemo } from './messagesdemo';

const meta: Meta<MessagesDemo> = {
  argTypes: {},
  component: MessagesDemo,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-messages-demo></app-messages-demo>`,
  }),
  title: 'dashboard/ng/uikit/messagesdemo',
};

export default meta;

type Story = StoryObj<MessagesDemo>;

/** Default Messages Demo state. */
export const Default: Story = {
  play: async ({ canvas, canvasElement, step, userEvent }) => {
    await step('render toast and inline message states', async () => {
      await expect(canvas.getByText('Toast')).toBeVisible();
      await expect(canvas.getByText('Inline')).toBeVisible();
      await expect(canvas.getByText('Username is required')).toBeVisible();
      await expect(canvas.getByText('Secondary Message')).toBeVisible();
    });

    await step('show a toast action', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /info/i }));

      await expect(within(canvasElement.ownerDocument.body).getByText('PrimeNG rocks')).toBeVisible();
    });
  },
};
