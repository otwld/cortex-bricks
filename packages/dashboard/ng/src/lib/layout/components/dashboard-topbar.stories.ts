import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { DashboardLayoutService } from '@otwld/ng-dashboard/core';
import { DashboardTopbar } from './dashboard-topbar';

const toggleMenu = fn();
const toggleConfigSidebar = fn();
const toggleProfileSidebar = fn();

const meta: Meta<DashboardTopbar> = {
  argTypes: {},
  component: DashboardTopbar,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: DashboardLayoutService,
          useValue: {
            toggleConfigSidebar,
            toggleMenu,
            toggleProfileSidebar,
          },
        },
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<dashboard-topbar></dashboard-topbar>`,
  }),
  title: 'dashboard/ng/layout/dashboard-topbar',
};

export default meta;

type Story = StoryObj<DashboardTopbar>;

/** Default Dashboard Topbar state. */
export const Default: Story = {
  play: async ({ canvas, canvasElement, step, userEvent }) => {
    await step('render dashboard search and toolbar actions', async () => {
      await expect(canvas.getByPlaceholderText('Search')).toBeVisible();
      await expect(canvas.getByAltText('Profile')).toBeVisible();
    });

    await step('emit layout actions from topbar controls', async () => {
      toggleMenu.mockClear();
      toggleConfigSidebar.mockClear();
      toggleProfileSidebar.mockClear();
      const menuButton = canvasElement.querySelector('.topbar-menubutton');

      await expect(menuButton).toBeVisible();
      await userEvent.click(menuButton as Element);
      await userEvent.click(canvas.getByRole('button', { name: /profile/i }));

      await expect(toggleMenu).toHaveBeenCalledTimes(1);
      await expect(toggleProfileSidebar).toHaveBeenCalledTimes(1);
    });
  },
};
