import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { ShoppingCartPage } from './shopping-cart.page';

const meta: Meta<ShoppingCartPage> = {
  argTypes: {},
  component: ShoppingCartPage,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-shopping-cart-page></app-shopping-cart-page>`,
  }),
  title: 'dashboard/ng/ecommerce/shopping-cart',
};

export default meta;

type Story = StoryObj<ShoppingCartPage>;

/** Default Shopping Cart Page state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render cart contents and totals', async () => {
      await expect(canvas.getByText('AeroShield™ Storm Jacket')).toBeVisible();
      await expect(canvas.getByText('Summary')).toBeVisible();
      await expect(canvas.getByRole('button', { name: /check out/i })).toBeVisible();
    });

    await step('enter a promotion code', async () => {
      await userEvent.type(canvas.getByLabelText('Promotion Code'), 'HIRING10');

      await expect(canvas.getByLabelText('Promotion Code')).toHaveValue('HIRING10');
      await expect(canvas.getByRole('button', { name: /apply/i })).toBeVisible();
    });
  },
};
