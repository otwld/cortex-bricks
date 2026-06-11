import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { MediaDemo } from './mediademo';

const meta: Meta<MediaDemo> = {
  argTypes: {},
  component: MediaDemo,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-media-demo></app-media-demo>`,
  }),
  title: 'dashboard/ng/uikit/mediademo',
};

export default meta;

type Story = StoryObj<MediaDemo>;

/** Default Media Demo state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render media demos and fixture content', async () => {
      await expect(canvas.getByText('Carousel')).toBeVisible();
      await expect(canvas.getByText('Image')).toBeVisible();
      await expect(canvas.getByText('Image Compare')).toBeVisible();
      await expect(canvas.getByText('Galleria')).toBeVisible();
      await expect(await canvas.findByText('Bamboo Watch')).toBeVisible();
    });

    await step('exercise a carousel action', async () => {
      const saveButton = canvas.getByRole('button', { name: /save bamboo watch/i });

      await userEvent.click(saveButton);

      await expect(saveButton).toBeVisible();
    });
  },
};
