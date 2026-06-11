import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { type BankingRecipient, RecentTransactionsTwoWidget } from './recent-transactions-two-widget';

const addRequested = fn();
const amountChanged = fn();
const paymentSent = fn();
const recipientSelected = fn();

const recipients: readonly BankingRecipient[] = [
  { id: 'aisha-williams', name: 'Aisha Williams', avatarUrl: '/demo/images/avatar/circle/avatar-f-1.png' },
  { id: 'jane-watson', name: 'Jane Watson', avatarUrl: '/demo/images/avatar/circle/avatar-f-2.png' },
  { id: 'brad-curry', name: 'Brad Curry', avatarUrl: '/demo/images/avatar/circle/avatar-m-1.png' },
  { id: 'claire-dunphy', name: 'Claire Dunphy', avatarUrl: '/demo/images/avatar/circle/avatar-f-3.png' },
];

const meta: Meta<RecentTransactionsTwoWidget> = {
  argTypes: {
    addButtonLabel: {
      control: 'text',
      description: 'Text shown in the add recipient button.',
      table: { category: 'Inputs' },
    },
    addRequested: {
      action: 'addRequested',
      description: 'Emitted when adding a recipient is requested.',
      table: { category: 'Outputs' },
    },
    amount: {
      control: { min: 0, type: 'number' },
      description: 'Controlled transfer amount.',
      table: { category: 'Inputs' },
    },
    amountChanged: {
      action: 'amountChanged',
      description: 'Emitted when the transfer amount input changes.',
      table: { category: 'Outputs' },
    },
    amountInputId: {
      control: 'text',
      description: 'Input id used by PrimeNG InputNumber.',
      table: { category: 'Inputs' },
    },
    currencyCode: {
      control: 'text',
      description: 'Currency code passed to PrimeNG InputNumber.',
      table: { category: 'Inputs' },
    },
    emptyMessage: {
      control: 'text',
      description: 'Message shown when no recipients are available.',
      table: { category: 'Inputs' },
    },
    locale: {
      control: 'text',
      description: 'Locale passed to PrimeNG InputNumber.',
      table: { category: 'Inputs' },
    },
    paymentSent: {
      action: 'paymentSent',
      description: 'Emitted when the send payment action is requested.',
      table: { category: 'Outputs' },
    },
    recipientSelected: {
      action: 'recipientSelected',
      description: 'Emitted when a recipient is selected.',
      table: { category: 'Outputs' },
    },
    recipients: {
      control: 'object',
      description: 'Recipients rendered in the picker grid.',
      table: { category: 'Inputs' },
    },
    selectedRecipientId: {
      control: 'text',
      description: 'Controlled selected recipient id.',
      table: { category: 'Inputs' },
    },
    sendButtonLabel: {
      control: 'text',
      description: 'Text shown in the send button.',
      table: { category: 'Inputs' },
    },
    title: {
      control: 'text',
      description: 'Heading shown above the recipient picker.',
      table: { category: 'Inputs' },
    },
  },
  args: {
    addButtonLabel: 'Add New',
    addRequested,
    amount: 850,
    amountChanged,
    amountInputId: 'banking-transfer-amount',
    currencyCode: 'USD',
    emptyMessage: 'No recipients to display.',
    locale: 'en-US',
    paymentSent,
    recipients,
    recipientSelected,
    selectedRecipientId: 'jane-watson',
    sendButtonLabel: 'Send',
  title: 'dashboard/ng/banking/recent-transactions-two-widget',
  },
  component: RecentTransactionsTwoWidget,
  render: (args) => ({
    props: args,
    template: `
      <app-recent-transactions-two-widget
        [title]="title"
        [recipients]="recipients"
        [selectedRecipientId]="selectedRecipientId"
        [amount]="amount"
        [currencyCode]="currencyCode"
        [locale]="locale"
        [amountInputId]="amountInputId"
        [addButtonLabel]="addButtonLabel"
        [sendButtonLabel]="sendButtonLabel"
        [emptyMessage]="emptyMessage"
        (recipientSelected)="recipientSelected($event)"
        (amountChanged)="amountChanged($event)"
        (addRequested)="addRequested()"
        (paymentSent)="paymentSent($event)"
      />
    `,
  }),
  title: 'dashboard/ng/banking/recent-transactions-two-widget',
};

export default meta;

type Story = StoryObj<RecentTransactionsTwoWidget>;

/** Default Recent Transactions Two Widget state. */
export const Default: Story = {
  play: async ({ canvas, canvasElement, step, userEvent }) => {
    await step('render recipients and transfer controls', async () => {
      await expect(canvas.getByText('Recent Transactions')).toBeVisible();
      await expect(canvas.getByRole('button', { name: /jane watson/i })).toBeVisible();
      await expect(canvas.getByRole('button', { name: /add new/i })).toBeVisible();
      await expect(canvasElement.querySelector('#banking-transfer-amount')).toBeVisible();
    });

    await step('emit recipient, add, and send actions', async () => {
      addRequested.mockClear();
      paymentSent.mockClear();
      recipientSelected.mockClear();

      await userEvent.click(canvas.getByRole('button', { name: /brad curry/i }));
      await expect(recipientSelected).toHaveBeenCalledWith({
        recipient: expect.objectContaining({ id: 'brad-curry', name: 'Brad Curry' }),
      });

      await userEvent.click(canvas.getByRole('button', { name: /add new/i }));
      await expect(addRequested).toHaveBeenCalledTimes(1);

      await userEvent.click(canvas.getByRole('button', { name: /^send$/i }));
      await expect(paymentSent).toHaveBeenCalledWith({
        amount: 850,
        recipient: expect.objectContaining({ id: 'jane-watson', name: 'Jane Watson' }),
      });
    });
  },
};
