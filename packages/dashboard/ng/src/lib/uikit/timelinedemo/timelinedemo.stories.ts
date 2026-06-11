import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { TimelineDemo } from './timelinedemo';

const meta: Meta<TimelineDemo> = {
  argTypes: {},
  component: TimelineDemo,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-timeline-demo></app-timeline-demo>`,
  }),
  title: 'dashboard/ng/uikit/timelinedemo',
};

export default meta;

type Story = StoryObj<TimelineDemo>;

/** Default Timeline Demo state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render timeline variants', async () => {
      await expect(canvas.getByText('Left Align')).toBeVisible();
      await expect(canvas.getByText('Right Align')).toBeVisible();
      await expect(canvas.getByText('Templating')).toBeVisible();
      await expect(canvas.getByText('Horizontal')).toBeVisible();
      await expect(canvas.getAllByText('Delivered')[0]).toBeVisible();
    });

    await step('exercise a templated action', async () => {
      const readMoreButton = canvas.getAllByRole('button', { name: /read more/i })[0];

      await userEvent.click(readMoreButton);

      await expect(readMoreButton).toBeVisible();
    });
  },
};
