import { signal } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { AuthService } from '@otwld/ng-auth/core';
import { DashboardLayoutService } from '@otwld/ng-dashboard/core';
import { of } from 'rxjs';
import { DashboardProfileSidebar } from './dashboard-profile-sidebar';

const layoutState = signal({
  profileSidebarVisible: true,
});
const logout = fn(() => of(undefined));

const meta: Meta<DashboardProfileSidebar> = {
  argTypes: {},
  component: DashboardProfileSidebar,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: DashboardLayoutService,
          useValue: {
            layoutState,
          },
        },
        {
          provide: AuthService,
          useValue: {
            logout,
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
    template: `<dashboard-profile-sidebar></dashboard-profile-sidebar>`,
  }),
  title: 'dashboard/ng/layout/components/dashboard-profile-sidebar',
};

export default meta;

type Story = StoryObj<DashboardProfileSidebar>;

/** Default Dashboard Profile Sidebar state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render the visible profile sidebar', async () => {
      layoutState.set({ profileSidebarVisible: true });

      await expect(await canvas.findByText('Isabella Andolini')).toBeVisible();
      await expect(canvas.getAllByText('Profile')[0]).toBeVisible();
      await expect(canvas.getByText('Billing')).toBeVisible();
    });

    await step('sign out and hide the sidebar', async () => {
      logout.mockClear();

      await userEvent.click(canvas.getByRole('button', { name: /sign out/i }));

      await expect(logout).toHaveBeenCalledTimes(1);
      await expect(layoutState().profileSidebarVisible).toBe(false);
    });
  },
};
