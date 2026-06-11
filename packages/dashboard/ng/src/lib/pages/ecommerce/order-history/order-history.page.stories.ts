import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { OrderHistoryPage } from './order-history.page';

const meta: Meta<OrderHistoryPage> = {
  argTypes: {},
  component: OrderHistoryPage,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-order-history-page></app-order-history-page>`,
  }),
  title: 'dashboard/ng/ecommerce/order-history',
};

export default meta;

type Story = StoryObj<OrderHistoryPage>;

/** Default Order History Page state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render order history filters', async () => {
      await expect(canvas.getByRole('button', { name: /^all$/i })).toBeVisible();
      await expect(canvas.getByText('SkyLum™ Urban Trench Coat')).toBeVisible();
      await expect(canvas.getByPlaceholderText('Search')).toBeVisible();
    });

    await step('filter completed orders and search for one product', async () => {
      await userEvent.click(canvas.getAllByRole('button', { name: /completed/i })[0]);
      await userEvent.type(canvas.getByPlaceholderText('Search'), 'AeroShield');

      await expect(canvas.getByText('AeroShield™ Storm Jacket')).toBeVisible();
      await expect(canvas.getByText('124812478')).toBeVisible();
    });

    await step('expand the filtered order details', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /order no:\s*124812478/i }));

      await expect(canvas.getByText('Credit Card')).toBeVisible();
      await expect(canvas.getByText('Michael Chen')).toBeVisible();
    });
  },
};
