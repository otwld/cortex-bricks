import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { List } from './list';

const meta: Meta<List> = {
  argTypes: {},
  component: List,
  parameters: {
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-list></app-list>`,
  }),
  title: 'dashboard/ng/apps/cms/list',
};

export default meta;

type Story = StoryObj<List>;

/** Default List state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render the featured CMS article list', async () => {
      await expect(canvas.getByText('Newest Blog')).toBeVisible();
      await expect(canvas.getByText('How Manufacturing Giants Drive Economic Growth')).toBeVisible();
      await expect(canvas.getByText('Industrial Investment Strategies That Drive Growth')).toBeVisible();
    });

    await step('advance the hero carousel', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /next slide/i }));

      await expect(canvas.getByText('Investment Strategies for Industrial Sectors')).toBeVisible();
    });
  },
};
