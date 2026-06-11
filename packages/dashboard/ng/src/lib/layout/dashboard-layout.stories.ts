import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { provideDashboardLayoutConfig, provideDashboardLayoutState } from '@otwld/ng-dashboard/core';
import { AuthService } from '@otwld/ng-auth/core';
import { of } from 'rxjs';
import { DashboardLayout } from './dashboard-layout';

const meta: Meta<DashboardLayout> = {
  argTypes: {},
  component: DashboardLayout,
  decorators: [
    applicationConfig({
      providers: [
        provideDashboardLayoutConfig(),
        provideDashboardLayoutState(),
        {
          provide: AuthService,
          useValue: {
            logout: () => of(undefined),
          },
        },
      ],
    }),
  ],
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-layout></app-layout>`,
  }),
  title: 'dashboard/ng/layout/dashboard-layout',
};

export default meta;

type Story = StoryObj<DashboardLayout>;

/** Default Dashboard Layout state. */
export const Default: Story = {
  play: async ({ canvas, step }) => {
    await step('render the composed dashboard shell', async () => {
      await expect(canvas.getByPlaceholderText('Search')).toBeVisible();
      await expect(canvas.getByText('Dashboards')).toBeVisible();
      await expect(canvas.getByText('Apps')).toBeVisible();
    });
  },
};
