import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn, waitFor, within } from 'storybook/test';
import { ComposeDialog } from './compose-dialog';

const closed = fn();
const send = fn();
const visibleChange = fn();

const meta: Meta<ComposeDialog> = {
  argTypes: {
    closed: {
      action: 'closed',
      description: 'Emitted when the compose dialog closes.',
      table: { category: 'Outputs' },
    },
    initialData: {
      control: 'object',
      description: 'Initial recipient, subject, and message form values.',
      table: { category: 'Inputs' },
    },
    send: {
      action: 'send',
      description: 'Emitted with the compose payload when the user sends.',
      table: { category: 'Outputs' },
    },
    visible: {
      control: 'boolean',
      description: 'Whether the compose dialog is visible.',
      table: { category: 'Inputs' },
    },
    visibleChange: {
      action: 'visibleChange',
      description: 'Emitted when dialog visibility changes.',
      table: { category: 'Outputs' },
    },
  },
  args: {
    closed,
    initialData: {
      message: 'Sharing the candidate profile summary for review.',
      subject: 'Candidate profile summary',
      to: 'recruiter.ada@example.com',
    },
    send,
    visible: true,
    visibleChange,
  },
  component: ComposeDialog,
  render: (args) => ({
    props: args,
    template: `
      <app-compose-dialog
        [visible]="visible"
        [initialData]="initialData"
        (visibleChange)="visibleChange($event)"
        (send)="send($event)"
        (closed)="closed()"
      />
    `,
  }),
  title: 'dashboard/ng/apps/mail/compose-dialog',
};

export default meta;

type Story = StoryObj<ComposeDialog>;

/** Default Compose Dialog state. */
export const Default: Story = {
  play: async ({ canvasElement, step, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await step('render initial compose data', async () => {
      const dialog = within(await body.findByRole('dialog', { name: /compose/i }));

      await expect(dialog.getByLabelText('To:')).toHaveValue('recruiter.ada@example.com');
      await expect(dialog.getByLabelText('Subject:')).toHaveValue('Candidate profile summary');
      await expect(dialog.getByPlaceholderText('Compose your message...')).toHaveValue(
        'Sharing the candidate profile summary for review.',
      );
    });

    await step('emit the send action with edited message data', async () => {
      send.mockClear();
      closed.mockClear();
      visibleChange.mockClear();

      const dialog = within(await body.findByRole('dialog', { name: /compose/i }));
      const messageInput = dialog.getByPlaceholderText('Compose your message...');
      const editedMessage = 'Candidate profile approved.';

      await userEvent.clear(messageInput);
      await userEvent.type(messageInput, editedMessage);
      await waitFor(() => expect(messageInput).toHaveValue(editedMessage));
      await userEvent.click(dialog.getByRole('button', { name: /send/i }));

      await expect(send).toHaveBeenCalledWith({
        message: editedMessage,
        subject: 'Candidate profile summary',
        to: 'recruiter.ada@example.com',
      });
      await expect(closed).toHaveBeenCalledTimes(1);
      await expect(visibleChange).toHaveBeenCalledWith(false);
    });
  },
};
