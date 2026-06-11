import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { DashboardUikitButtonsPage } from './dashboard-uikit-buttons.page';

const meta: Meta<DashboardUikitButtonsPage> = {
  argTypes: {},
  component: DashboardUikitButtonsPage,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<dashboard-uikit-buttons-page></dashboard-uikit-buttons-page>`,
  }),
  title: 'dashboard/ng/uikit/buttons/dashboard-uikit-buttons',
};

export default meta;

type Story = StoryObj<DashboardUikitButtonsPage>;

/** Default Dashboard UI Kit Buttons Page state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render the button variants', async () => {
      await expect(canvas.getByText('Default')).toBeVisible();
      await expect(canvas.getByText('SplitButton')).toBeVisible();
      await expect(canvas.getByText('Loading')).toBeVisible();
      await expect(canvas.getByRole('button', { name: /disabled/i })).toBeDisabled();
      await expect(canvas.getAllByRole('button', { name: /primeng logo/i })[0]).toBeVisible();
    });

    await step('exercise a loading button', async () => {
      const searchButtons = canvas.getAllByRole('button', { name: /search/i });

      await userEvent.click(searchButtons[0]);

      await expect(searchButtons[0]).toBeVisible();
    });
  },
};
