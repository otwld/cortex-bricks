import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { EmptyPage } from './empty.page';

const meta: Meta<EmptyPage> = {
  argTypes: {},
  component: EmptyPage,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-empty-page></app-empty-page>`,
  }),
  title: 'dashboard/ng/pages/empty',
};

export default meta;

type Story = StoryObj<EmptyPage>;

/** Default Empty Page state. */
export const Default: Story = {
  play: async ({ canvas, step }) => {
    await step('render the starter page copy', async () => {
      await expect(canvas.getByText('Empty Page')).toBeVisible();
      await expect(canvas.getByText(/start from scratch/i)).toBeVisible();
    });
  },
};
