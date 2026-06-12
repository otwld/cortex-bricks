import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { DashboardBankingPage } from './dashboard-banking.page';

const meta: Meta<DashboardBankingPage> = {
  argTypes: {},
  component: DashboardBankingPage,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  title: 'dashboard/ng/banking/dashboard-banking',
};

export default meta;

type Story = StoryObj<DashboardBankingPage>;

/** Default Dashboard Banking Page state. */
export const Default: Story = {
  play: async ({ canvas, step }) => {
    await step('render the composed banking dashboard', async () => {
      await expect(canvas.getByText('Welcome Isabel')).toBeVisible();
      await expect(canvas.getByText('Debit Card')).toBeVisible();
      await expect(canvas.getAllByText('Recent Transactions')[0]).toBeVisible();
      await expect(canvas.getByText('Monthly Payments')).toBeVisible();
      await expect(canvas.getByText('Overview')).toBeVisible();
    });
  },
};
