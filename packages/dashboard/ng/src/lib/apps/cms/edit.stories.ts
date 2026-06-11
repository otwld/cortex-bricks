import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { Edit } from './edit';

const meta: Meta<Edit> = {
  argTypes: {},
  component: Edit,
  parameters: {
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-edit></app-edit>`,
  }),
  title: 'dashboard/ng/apps/cms/edit',
};

export default meta;

type Story = StoryObj<Edit>;

/** Default Edit state. */
export const Default: Story = {
  play: async ({ canvas, canvasElement, step, userEvent }) => {
    await step('render the post editor controls', async () => {
      await expect(canvas.getByRole('heading', { name: /create a new post/i })).toBeVisible();
      await expect(canvas.getByLabelText('Title')).toHaveValue('The Smartest Ways to Earn Airline Miles');
      await expect(canvas.getByRole('button', { name: /save draft/i })).toBeVisible();
      await expect(canvas.getByRole('button', { name: /publish/i })).toBeVisible();
    });

    await step('edit the article title', async () => {
      const title = canvas.getByLabelText('Title');

      await userEvent.clear(title);
      await userEvent.type(title, 'Industrial Finance Outlook');

      await expect(title).toHaveValue('Industrial Finance Outlook');
    });

    await step('remove the current cover image', async () => {
      await expect(canvas.getByAltText('Cover image')).toBeVisible();

      const removeCoverButton = canvasElement.querySelector('.pi-trash')?.closest('button');
      await expect(removeCoverButton).not.toBeNull();

      await userEvent.click(removeCoverButton!);

      await expect(canvas.getByText('Click to upload cover image')).toBeVisible();
    });
  },
};
