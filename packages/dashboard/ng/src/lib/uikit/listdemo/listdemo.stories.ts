import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { ListDemo } from './listdemo';

const meta: Meta<ListDemo> = {
  argTypes: {},
  component: ListDemo,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-list-demo></app-list-demo>`,
  }),
  title: 'dashboard/ng/uikit/listdemo',
};

export default meta;

type Story = StoryObj<ListDemo>;

/** Default List Demo state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render data view and list controls', async () => {
      await expect(await canvas.findByText('Bamboo Watch')).toBeVisible();
      await expect(canvas.getByText('PickList')).toBeVisible();
      await expect(canvas.getByText('OrderList')).toBeVisible();
      await expect(canvas.getByText('San Francisco')).toBeVisible();
    });

    await step('exercise a product action', async () => {
      const saveButton = canvas.getByRole('button', { name: /save bamboo watch/i });

      await userEvent.click(saveButton);

      await expect(saveButton).toBeVisible();
    });
  },
};
