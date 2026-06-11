import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { TableDemo } from './tabledemo';

const meta: Meta<TableDemo> = {
  argTypes: {},
  component: TableDemo,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-table-demo></app-table-demo>`,
  }),
  title: 'dashboard/ng/uikit/tabledemo',
};

export default meta;

type Story = StoryObj<TableDemo>;

/** Default Table Demo state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render fixture-backed tables', async () => {
      await expect((await canvas.findAllByText('James Butt'))[0]).toBeVisible();
      await expect(canvas.getByText('Frozen Columns')).toBeVisible();
      await expect(canvas.getByText('Row Expansion')).toBeVisible();
      await expect(canvas.getByText('Grouping')).toBeVisible();
    });

    await step('use global filtering controls', async () => {
      const searchInput = canvas.getByPlaceholderText('Search keyword');

      await userEvent.type(searchInput, 'James');
      await expect(searchInput).toHaveValue('James');

      await userEvent.click(canvas.getByRole('button', { name: /clear/i }));
      await expect(searchInput).toHaveValue('');
    });

    await step('expand product order rows', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /expand all/i }));

      await expect(canvas.getByText(/Orders for Bamboo Watch/i)).toBeVisible();
    });
  },
};
