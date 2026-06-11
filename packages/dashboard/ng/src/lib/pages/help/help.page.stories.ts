import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { HelpPage } from './help.page';

const meta: Meta<HelpPage> = {
  argTypes: {},
  component: HelpPage,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-help-page></app-help-page>`,
  }),
  title: 'dashboard/ng/help',
};

export default meta;

type Story = StoryObj<HelpPage>;

/** Default Help Page state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render help center categories', async () => {
      await expect(canvas.getByText('How can we help?')).toBeVisible();
      await expect(canvas.getByText('Getting Started')).toBeVisible();
      await expect(canvas.getByText('Security')).toBeVisible();
    });

    await step('enter a help search query', async () => {
      await userEvent.type(canvas.getByPlaceholderText('Search'), 'invoice');

      await expect(canvas.getByPlaceholderText('Search')).toHaveValue('invoice');
    });
  },
};
