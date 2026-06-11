import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import {
  DashboardLayoutService,
  provideDashboardLayoutConfig,
  provideDashboardLayoutState,
} from '@otwld/ng-dashboard/core';
import { DashboardConfigurator } from './dashboard-configurator';

const meta: Meta<DashboardConfigurator> = {
  argTypes: {
    simple: {
      control: 'boolean',
      description: 'Render the compact cog trigger before the settings drawer.',
      table: { category: 'Inputs' },
    },
  },
  args: {
    simple: false,
  },
  component: DashboardConfigurator,
  decorators: [
    applicationConfig({
      providers: [
        provideDashboardLayoutConfig(),
        provideDashboardLayoutState({
          configSidebarVisible: true,
        }),
        DashboardLayoutService,
      ],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `<app-configurator [simple]="simple"></app-configurator>`,
  }),
  title: 'dashboard/ng/layout/components/dashboard-configurator',
};

export default meta;

type Story = StoryObj<DashboardConfigurator>;

/** Default Dashboard Configurator state. */
export const Default: Story = {
  play: async ({ canvas, step }) => {
    await step('render dashboard theme and menu settings', async () => {
      await expect(await canvas.findByText('Settings')).toBeVisible();
      await expect(canvas.getByText('Primary')).toBeVisible();
      await expect(canvas.getByText('Surface')).toBeVisible();
      await expect(canvas.getByText('Menu Type')).toBeVisible();
    });
  },
};
