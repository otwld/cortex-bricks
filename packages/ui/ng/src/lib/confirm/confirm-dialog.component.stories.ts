import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { ConfirmDialogComponent } from './confirm-dialog.component';

const confirm = fn();
const cancel = fn();

const meta: Meta<ConfirmDialogComponent> = {
  argTypes: {
    body: {
      control: 'text',
      description: 'Dialog body text.',
      table: { category: 'Inputs' },
    },
    cancel: {
      action: 'cancel',
      description: 'Emitted when the user cancels the dialog.',
      table: { category: 'Outputs' },
    },
    cancelLabel: {
      control: 'text',
      description: 'Label for the cancellation action.',
      table: { category: 'Inputs' },
    },
    confirm: {
      action: 'confirm',
      description: 'Emitted when the user confirms the dialog.',
      table: { category: 'Outputs' },
    },
    confirmLabel: {
      control: 'text',
      description: 'Label for the confirmation action.',
      table: { category: 'Inputs' },
    },
    title: {
      control: 'text',
      description: 'Dialog title text.',
      table: { category: 'Inputs' },
    },
  },
  args: {
    body: 'This will remove the candidate from the active shortlist.',
    cancel,
    cancelLabel: 'Keep candidate',
    confirm,
    confirmLabel: 'Remove candidate',
  title: 'ui/ng/confirm/confirm-dialog',
  },
  component: ConfirmDialogComponent,
  render: (args) => ({
    props: args,
    template: `
      <kit-confirm-dialog
        [title]="title"
        [body]="body"
        [confirmLabel]="confirmLabel"
        [cancelLabel]="cancelLabel"
        (confirm)="confirm()"
        (cancel)="cancel()"
      />
    `,
  }),
  title: 'ui/ng/confirm/confirm-dialog',
};

export default meta;

type Story = StoryObj<ConfirmDialogComponent>;

/** Default Confirm Dialog Component state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render the confirmation copy', async () => {
      await expect(canvas.getByRole('dialog')).toBeVisible();
      await expect(canvas.getByRole('heading', { name: /remove candidate/i })).toBeVisible();
      await expect(canvas.getByText(/active shortlist/i)).toBeVisible();
    });

    await step('emit cancel and confirm actions', async () => {
      cancel.mockClear();
      confirm.mockClear();

      await userEvent.click(canvas.getByRole('button', { name: /keep candidate/i }));
      await userEvent.click(canvas.getByRole('button', { name: /remove candidate/i }));

      await expect(cancel).toHaveBeenCalledTimes(1);
      await expect(confirm).toHaveBeenCalledTimes(1);
    });
  },
};
