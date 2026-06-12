import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { DashboardEcommercePage } from './dashboard-ecommerce.page';

const meta: Meta<DashboardEcommercePage> = {
  argTypes: {},
  component: DashboardEcommercePage,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  title: 'dashboard/ng/ecommerce/dashboard-ecommerce',
};

export default meta;

type Story = StoryObj<DashboardEcommercePage>;

/** Default Dashboard Ecommerce Page state. */
export const Default: Story = {
  play: async ({ canvas, step }) => {
    await step('render the composed ecommerce dashboard', async () => {
      await expect(canvas.getByText('Sales')).toBeVisible();
      await expect(canvas.getByText('Revenue Overview')).toBeVisible();
      await expect(canvas.getByText('Sales by Category')).toBeVisible();
      await expect(canvas.getByText('Recent Sales')).toBeVisible();
      await expect(canvas.getByText('Top Products')).toBeVisible();
      await expect(canvas.getByText('Revenue Stream')).toBeVisible();
    });
  },
};
