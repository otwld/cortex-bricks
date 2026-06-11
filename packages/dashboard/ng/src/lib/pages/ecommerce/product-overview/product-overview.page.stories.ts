import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { ProductOverviewPage } from './product-overview.page';

const meta: Meta<ProductOverviewPage> = {
  argTypes: {},
  component: ProductOverviewPage,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-product-overview-page></app-product-overview-page>`,
  }),
  title: 'dashboard/ng/pages/ecommerce/product-overview',
};

export default meta;

type Story = StoryObj<ProductOverviewPage>;

/** Default Product Overview Page state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render product details and actions', async () => {
      await expect(canvas.getAllByText('AeroShield™ Storm Jacket')[0]).toBeVisible();
      await expect(canvas.getByRole('button', { name: /add to cart/i })).toBeVisible();
      await expect(canvas.getByText('Product Description')).toBeVisible();
    });

    await step('select a size and open product Q&A', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'M' }));
      await userEvent.click(canvas.getByText('Question and Answer'));

      await expect(canvas.getByText('Is this jacket suitable for heavy rain?')).toBeVisible();
    });

    await step('open review filters', async () => {
      await userEvent.click(canvas.getByText('Evaluations'));
      await userEvent.click(canvas.getByRole('button', { name: /5 star/i }));

      await expect(canvas.getByText('Liam Carter')).toBeVisible();
    });
  },
};
