import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { BlocksPage } from './blocks.page';

const meta: Meta<BlocksPage> = {
  argTypes: {},
  component: BlocksPage,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-blocks-page></app-blocks-page>`,
  }),
  title: 'dashboard/ng/blocks',
};

export default meta;

type Story = StoryObj<BlocksPage>;

/** Default Blocks Page state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render the blocks gallery', async () => {
      await expect(canvas.getByText('Hero')).toBeVisible();
      await expect(canvas.getByText('Feature')).toBeVisible();
      await expect(canvas.getByText('Pricing')).toBeVisible();
      await expect(canvas.getByText('Create the screens your')).toBeVisible();
    });

    await step('switch one block between code and preview', async () => {
      await userEvent.click(canvas.getAllByRole('button', { name: /code/i })[0]);

      await expect(canvas.getAllByText(/Create the screens your/i)[0]).toBeVisible();

      await userEvent.click(canvas.getAllByRole('button', { name: /preview/i })[0]);

      await expect(canvas.getByText('visitors deserve to see')).toBeVisible();
    });
  },
};
