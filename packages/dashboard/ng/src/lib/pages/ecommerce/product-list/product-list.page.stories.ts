import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { ProductListPage } from './product-list.page';

const meta: Meta<ProductListPage> = {
  argTypes: {},
  component: ProductListPage,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-product-list-page></app-product-list-page>`,
  }),
  title: 'dashboard/ng/pages/ecommerce/product-list',
};

export default meta;

type Story = StoryObj<ProductListPage>;

/** Default Product List Page state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render product grid and filters', async () => {
      await expect(canvas.getByPlaceholderText('Search')).toBeVisible();
      await expect(canvas.getByText('SkyLum™ Urban Trench Coat')).toBeVisible();
      await expect(canvas.getByText('StormEdge™ Midnight Coat')).toBeVisible();
    });

    await step('filter products by search text', async () => {
      await userEvent.type(canvas.getByPlaceholderText('Search'), 'StormEdge');

      await expect(canvas.getByText('StormEdge™ Midnight Coat')).toBeVisible();
      await expect(canvas.queryByText('SkyLum™ Urban Trench Coat')).not.toBeInTheDocument();
    });
  },
};
