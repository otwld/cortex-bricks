import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { OverlayDemo } from './overlaydemo';

const meta: Meta<OverlayDemo> = {
  argTypes: {},
  component: OverlayDemo,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-overlay-demo></app-overlay-demo>`,
  }),
  title: 'dashboard/ng/uikit/overlaydemo',
};

export default meta;

type Story = StoryObj<OverlayDemo>;

/** Default Overlay Demo state. */
export const Default: Story = {
  play: async ({ canvas, canvasElement, step, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await step('render overlay launchers', async () => {
      await expect(canvas.getByText('Dialog')).toBeVisible();
      await expect(canvas.getByText('Popover')).toBeVisible();
      await expect(canvas.getByText('Drawer')).toBeVisible();
      await expect(canvas.getByText('ConfirmPopup')).toBeVisible();
    });

    await step('open and close the dialog', async () => {
      await userEvent.click(canvas.getAllByRole('button', { name: /^show$/i })[0]);

      const dialog = await body.findByRole('dialog', { name: /dialog/i });

      await expect(dialog).toBeInTheDocument();
      await userEvent.click(within(dialog).getByRole('button', { name: /save/i }));
    });

    await step('open the confirm popup', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /confirm/i }));

      await expect(await body.findByText('Are you sure that you want to proceed?')).toBeInTheDocument();
    });
  },
};
