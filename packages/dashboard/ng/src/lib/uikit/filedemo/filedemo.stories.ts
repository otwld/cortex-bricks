import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { FileDemo } from './filedemo';

const meta: Meta<FileDemo> = {
  argTypes: {},
  component: FileDemo,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-file-demo></app-file-demo>`,
  }),
  title: 'dashboard/ng/uikit/filedemo',
};

export default meta;

type Story = StoryObj<FileDemo>;

/** Default File Demo state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render both upload modes', async () => {
      await expect(canvas.getByText('Advanced')).toBeVisible();
      await expect(canvas.getByText('Basic')).toBeVisible();
      await expect(canvas.getByText('Drag and drop files to here to upload.')).toBeVisible();
      await expect(canvas.getByRole('button', { name: /choose/i })).toBeVisible();
    });

    await step('exercise the empty basic upload command', async () => {
      const uploadButton = canvas.getByRole('button', { name: /upload/i });

      await userEvent.click(uploadButton);

      await expect(uploadButton).toBeVisible();
    });
  },
};
