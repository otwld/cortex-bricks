import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { OrderSummaryPage } from './order-summary.page';

const meta: Meta<OrderSummaryPage> = {
  argTypes: {},
  component: OrderSummaryPage,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-order-summary-page></app-order-summary-page>`,
  }),
  title: 'dashboard/ng/ecommerce/order-summary',
};

export default meta;

type Story = StoryObj<OrderSummaryPage>;

/** Default Order Summary Page state. */
export const Default: Story = {
  play: async ({ canvas, step }) => {
    await step('render successful order summary', async () => {
      await expect(canvas.getByText('Successful Order')).toBeVisible();
      await expect(canvas.getByText('Total')).toBeVisible();
      await expect(canvas.getByRole('button', { name: /download invoice/i })).toBeVisible();
    });
  },
};
