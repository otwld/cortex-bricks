import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { PanelsDemo } from './panelsdemo';

const meta: Meta<PanelsDemo> = {
  argTypes: {},
  component: PanelsDemo,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-panels-demo></app-panels-demo>`,
  }),
  title: 'dashboard/ng/uikit/panelsdemo',
};

export default meta;

type Story = StoryObj<PanelsDemo>;

/** Default Panels Demo state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render panel examples', async () => {
      await expect(canvas.getByText('Toolbar')).toBeVisible();
      await expect(canvas.getByText('Accordion')).toBeVisible();
      await expect(canvas.getByText('Tabs')).toBeVisible();
      await expect(canvas.getByText('Splitter')).toBeVisible();
    });

    await step('fill the toolbar search input', async () => {
      const searchInput = canvas.getByPlaceholderText('Search');

      await userEvent.type(searchInput, 'Candidate');

      await expect(searchInput).toHaveValue('Candidate');
    });

    await step('switch an accordion panel', async () => {
      const accordionPanel = canvas.getByRole('button', { name: 'Header II' });

      await userEvent.click(accordionPanel);

      await expect(accordionPanel).toHaveAttribute('aria-expanded', 'true');
    });
  },
};
