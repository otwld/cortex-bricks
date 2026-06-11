import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { CheckoutFormPage } from './checkout-form.page';

const meta: Meta<CheckoutFormPage> = {
  argTypes: {},
  component: CheckoutFormPage,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-checkout-form-page></app-checkout-form-page>`,
  }),
  title: 'dashboard/ng/pages/ecommerce/checkout-form',
};

export default meta;

type Story = StoryObj<CheckoutFormPage>;

/** Default Checkout Form Page state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render order totals and payment fields', async () => {
      await expect(canvas.getByText('Checkout Form')).toBeVisible();
      await expect(canvas.getByText('AeroShield™ Storm Jacket')).toBeVisible();
      await expect(canvas.getByRole('button', { name: /pay \$909.97/i })).toBeVisible();
    });

    await step('enter checkout details', async () => {
      await userEvent.type(canvas.getByLabelText('Email'), 'recruiter@example.com');
      await userEvent.type(canvas.getByLabelText('Card Details'), '4242424242424242');
      await userEvent.type(canvas.getByLabelText('Cardholder Name'), 'Aisha Patel');
      await userEvent.type(canvas.getByLabelText('Tax ID number'), 'TAX-2026');
      await userEvent.type(canvas.getByLabelText('Discount code'), 'HIRING10');

      await expect(canvas.getByLabelText('Email')).toHaveValue('recruiter@example.com');
      await expect(canvas.getByLabelText('Cardholder Name')).toHaveValue('Aisha Patel');
      await expect(canvas.getByLabelText('Discount code')).toHaveValue('HIRING10');
    });
  },
};
