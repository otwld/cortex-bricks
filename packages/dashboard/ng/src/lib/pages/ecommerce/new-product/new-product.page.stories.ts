import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { NewProductPage } from './new-product.page';

const meta: Meta<NewProductPage> = {
  argTypes: {},
  component: NewProductPage,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-new-product-page></app-new-product-page>`,
  }),
  title: 'dashboard/ng/pages/ecommerce/new-product',
};

export default meta;

type Story = StoryObj<NewProductPage>;

/** Default New Product Page state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render the product editor', async () => {
      await expect(canvas.getAllByText('Add Product')[0]).toBeVisible();
      await expect(canvas.getByText('Product Preview')).toBeVisible();
      await expect(canvas.getByText('Drop or select a cover image')).toBeVisible();
    });

    await step('enter draft product details', async () => {
      await userEvent.type(canvas.getByPlaceholderText('Enter product name'), 'Candidate Onboarding Kit');
      await userEvent.type(canvas.getByPlaceholderText('Enter brand name'), 'TalentForge');
      await userEvent.type(canvas.getByPlaceholderText('Enter price'), '189');
      await userEvent.click(canvas.getByRole('button', { name: 'M' }));

      await expect(canvas.getByPlaceholderText('Enter product name')).toHaveValue('Candidate Onboarding Kit');
      await expect(canvas.getByPlaceholderText('Enter brand name')).toHaveValue('TalentForge');
      await expect(canvas.getByPlaceholderText('Enter price')).toHaveValue('189');
      await expect(canvas.getByRole('button', { name: /add product/i })).toBeVisible();
    });
  },
};
