import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import {
  DashboardLayoutService,
  provideDashboardLayoutConfig,
  provideDashboardLayoutState,
} from '@otwld/ng-dashboard/core';
import { DashboardSidebar } from './dashboard-sidebar';

const meta: Meta<DashboardSidebar> = {
  argTypes: {},
  component: DashboardSidebar,
  decorators: [
    applicationConfig({
      providers: [provideDashboardLayoutConfig(), provideDashboardLayoutState(), DashboardLayoutService],
    }),
  ],
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<dashboard-sidebar></dashboard-sidebar>`,
  }),
  title: 'dashboard/ng/layout/dashboard-sidebar',
};

export default meta;

type Story = StoryObj<DashboardSidebar>;

/** Default Dashboard Sidebar state. */
export const Default: Story = {
  play: async ({ canvas, step }) => {
    await step('render sidebar branding and menu pin control', async () => {
      await expect(canvas.getAllByAltText('logo')[0]).toBeVisible();
      await expect(canvas.getByRole('button', { name: /toggle sidebar pin/i })).toBeVisible();
      await expect(canvas.getByText('Dashboards')).toBeVisible();
    });
  },
};
