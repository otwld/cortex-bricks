import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { DashboardBreadcrumb } from './dashboard-breadcrumb';

const meta: Meta<DashboardBreadcrumb> = {
  argTypes: {},
  component: DashboardBreadcrumb,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<nav dashboard-breadcrumb aria-label="Breadcrumb"></nav>`,
  }),
  title: 'dashboard/ng/layout/components/dashboard-breadcrumb',
};

export default meta;

type Story = StoryObj<DashboardBreadcrumb>;

/** Default Dashboard Breadcrumb state. */
export const Default: Story = {
  play: async ({ canvas, step }) => {
    await step('render the breadcrumb navigation host', async () => {
      await expect(canvas.getByLabelText('Breadcrumb')).toBeVisible();
    });
  },
};
