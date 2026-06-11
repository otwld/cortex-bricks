import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { DashboardMenu } from './dashboard-menu';

const meta: Meta<DashboardMenu> = {
  argTypes: {},
  component: DashboardMenu,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<dashboard-menu></dashboard-menu>`,
  }),
  title: 'dashboard/ng/layout/components/dashboard-menu',
};

export default meta;

type Story = StoryObj<DashboardMenu>;

/** Default Dashboard Menu state. */
export const Default: Story = {
  play: async ({ canvas, step }) => {
    await step('render dashboard navigation groups', async () => {
      await expect(canvas.getByText('Dashboards')).toBeVisible();
      await expect(canvas.getByText('Apps')).toBeVisible();
      await expect(canvas.getByText('UI Kit')).toBeVisible();
      await expect(canvas.getByText('User Management')).toBeVisible();
    });
  },
};
