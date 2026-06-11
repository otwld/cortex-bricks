import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { type BankingTransaction, RecentTransactionsWidget } from './recent-transactions-widget';

const transactionSelected = fn();

const transactions: readonly BankingTransaction[] = [
  { id: 'job-board-seat', merchant: 'JobBoard Pro', date: '06/03/2026', amount: 250, imageUrl: '/demo/images/banking/airbnb.png' },
  { id: 'candidate-checks', merchant: 'Candidate Checks', date: '06/04/2026', amount: 50, imageUrl: '/demo/images/banking/amazon.png' },
  { id: 'interview-tools', merchant: 'Interview Tools', date: '06/07/2026', amount: 60, imageUrl: '/demo/images/banking/nike.svg', roundedImage: true },
];

const meta: Meta<RecentTransactionsWidget> = {
  argTypes: {
    currencyCode: {
      control: 'text',
      description: 'Currency code passed to Angular currency formatting.',
      table: { category: 'Inputs' },
    },
    currencyDigits: {
      control: 'text',
      description: 'Digit info passed to Angular currency formatting.',
      table: { category: 'Inputs' },
    },
    currencyDisplay: {
      control: 'select',
      description: 'Currency display style passed to Angular currency formatting.',
      options: ['symbol', 'code', 'symbol-narrow'],
      table: { category: 'Inputs' },
    },
    emptyMessage: {
      control: 'text',
      description: 'Message shown when no transactions are available.',
      table: { category: 'Inputs' },
    },
    maxTransactions: {
      control: { min: 0, type: 'number' },
      description: 'Maximum number of transactions displayed.',
      table: { category: 'Inputs' },
    },
    showTransactionActions: {
      control: 'boolean',
      description: 'Whether per-transaction action buttons are rendered.',
      table: { category: 'Inputs' },
    },
    title: {
      control: 'text',
      description: 'Heading shown above the transaction list.',
      table: { category: 'Inputs' },
    },
    transactionSelected: {
      action: 'transactionSelected',
      description: 'Emitted when a transaction action is selected.',
      table: { category: 'Outputs' },
    },
    transactions: {
      control: 'object',
      description: 'Transactions rendered in the compact list.',
      table: { category: 'Inputs' },
    },
  },
  args: {
    currencyCode: 'USD',
    currencyDigits: '1.2-2',
    currencyDisplay: 'symbol',
    emptyMessage: 'No recent transactions to display.',
    maxTransactions: 5,
    showTransactionActions: true,
    title: 'Recent Transactions',
    transactionSelected,
    transactions,
  },
  component: RecentTransactionsWidget,
  render: (args) => ({
    props: args,
    template: `
      <app-recent-transactions-widget
        [title]="title"
        [transactions]="transactions"
        [maxTransactions]="maxTransactions"
        [showTransactionActions]="showTransactionActions"
        [currencyCode]="currencyCode"
        [currencyDisplay]="currencyDisplay"
        [currencyDigits]="currencyDigits"
        [emptyMessage]="emptyMessage"
        (transactionSelected)="transactionSelected($event)"
      />
    `,
  }),
  title: 'dashboard/ng/banking/recent-transactions-widget',
};

export default meta;

type Story = StoryObj<RecentTransactionsWidget>;

/** Default Recent Transactions Widget state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render the compact transaction list', async () => {
      await expect(canvas.getByText('Recent Transactions')).toBeVisible();
      await expect(canvas.getByText('JobBoard Pro')).toBeVisible();
      await expect(canvas.getByText('Candidate Checks')).toBeVisible();
      await expect(canvas.getByText('$250.00')).toBeVisible();
    });

    await step('emit the selected transaction action', async () => {
      transactionSelected.mockClear();

      await userEvent.click(canvas.getByRole('button', { name: /view candidate checks transaction/i }));

      await expect(transactionSelected).toHaveBeenCalledWith({
        transaction: expect.objectContaining({ id: 'candidate-checks', merchant: 'Candidate Checks' }),
      });
    });
  },
};
