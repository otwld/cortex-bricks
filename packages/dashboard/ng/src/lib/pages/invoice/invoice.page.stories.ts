import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { InvoicePage } from './invoice.page';

const meta: Meta<InvoicePage> = {
  argTypes: {},
  component: InvoicePage,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-invoice-page></app-invoice-page>`,
  }),
  title: 'dashboard/ng/pages/invoice',
};

export default meta;

type Story = StoryObj<InvoicePage>;

/** Default Invoice Page state. */
export const Default: Story = {
  play: async ({ canvas, step }) => {
    await step('render invoice identity and totals', async () => {
      await expect(canvas.getByText('YOUR COMPANY')).toBeVisible();
      await expect(canvas.getByText('INVOICE')).toBeVisible();
      await expect(canvas.getByText('Claire Williams, 148 Hope Lane')).toBeVisible();
      await expect(canvas.getAllByText('$332.00')[0]).toBeVisible();
    });
  },
};
