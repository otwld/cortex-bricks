import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { FilesPage } from './files.page';

const meta: Meta<FilesPage> = {
  argTypes: {},
  component: FilesPage,
  parameters: {
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-files></app-files>`,
  }),
  title: 'dashboard/ng/apps/files',
};

export default meta;

type Story = StoryObj<FilesPage>;

/** Default Files Page state. */
export const Default: Story = {
  play: async ({ canvas, canvasElement, step, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await step('render storage overview and documents', async () => {
      await expect(canvas.getByText('Overview')).toBeVisible();
      await expect(canvas.getByText('Activity Feed')).toBeVisible();
      await expect(canvas.getByText('Documents')).toBeVisible();
      await expect(canvas.getByText('Diamond')).toBeVisible();
    });

    await step('filter documents by large files', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /large files/i }));

      await expect(canvas.getByText('PrimeBlocks')).toBeVisible();
      await expect(canvas.getByText('Database')).toBeVisible();
    });

    await step('add a document from the editor drawer', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /add new/i }));

      await userEvent.type(await body.findByLabelText('Name'), 'Candidate Packet');
      await userEvent.type(body.getByLabelText('Owner'), 'Ada Lovelace');
      await userEvent.click(body.getByRole('button', { name: /add document/i }));
      await userEvent.click(canvas.getByRole('button', { name: /all files/i }));

      await expect(canvas.getByText('Candidate Packet')).toBeVisible();
    });
  },
};
