import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { Detail } from './detail';

const meta: Meta<Detail> = {
  argTypes: {},
  component: Detail,
  parameters: {
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-detail></app-detail>`,
  }),
  title: 'dashboard/ng/apps/cms/detail',
};

export default meta;

type Story = StoryObj<Detail>;

/** Default Detail state. */
export const Default: Story = {
  play: async ({ canvas, step }) => {
    await step('render the article header and metadata', async () => {
      await expect(canvas.getByRole('heading', { name: /how manufacturing giants drive economic growth/i })).toBeVisible();
      await expect(canvas.getByText('Newest Blog • 6 Min')).toBeVisible();
      await expect(canvas.getByText('Industrial Economics')).toBeVisible();
    });

    await step('render related reading and comments', async () => {
      await expect(canvas.getByRole('heading', { name: /keep reading/i })).toBeVisible();
      await expect(canvas.getByText('Emma Stone')).toBeVisible();
      await expect(canvas.getByRole('button', { name: /view comments/i })).toBeVisible();
    });
  },
};
