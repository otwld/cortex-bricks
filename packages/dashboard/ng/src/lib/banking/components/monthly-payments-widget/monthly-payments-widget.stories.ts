import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { type MonthlyPayment, MonthlyPaymentsWidget } from './monthly-payments-widget';

const paymentSelected = fn();

const payments: readonly MonthlyPayment[] = [
  { id: 'recruiter-seat', name: 'Recruiter Platform Seat', amount: 75.6, paid: true, date: '06/04/2026' },
  { id: 'candidate-screening', name: 'Candidate Screening', amount: 45.5, paid: true, date: '06/07/2026' },
  { id: 'interview-room', name: 'Interview Room', amount: 45.2, paid: false, date: '06/12/2026' },
];

const meta: Meta<MonthlyPaymentsWidget> = {
  argTypes: {
    currencyCode: {
      control: 'text',
      description: 'Currency code passed to the amount formatter.',
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
      description: 'Message shown when the payment list is empty.',
      table: { category: 'Inputs' },
    },
    paymentSelected: {
      action: 'paymentSelected',
      description: 'Emitted when a payment row action is selected.',
      table: { category: 'Outputs' },
    },
    payments: {
      control: 'object',
      description: 'Rows rendered in the monthly payment table.',
      table: { category: 'Inputs' },
    },
    rows: {
      control: { min: 1, type: 'number' },
      description: 'Rows configured on the PrimeNG table.',
      table: { category: 'Inputs' },
    },
    showPaymentActions: {
      control: 'boolean',
      description: 'Whether per-payment action buttons are rendered.',
      table: { category: 'Inputs' },
    },
    title: {
      control: 'text',
      description: 'Heading shown above the payment table.',
      table: { category: 'Inputs' },
    },
  },
  args: {
    currencyCode: 'USD',
    currencyDigits: '1.2-2',
    currencyDisplay: 'symbol',
    emptyMessage: 'No monthly payments to display.',
    paymentSelected,
    payments,
    rows: 5,
    showPaymentActions: true,
    title: 'dashboard/ng/banking/components/monthly-payments-widget',
  },
  component: MonthlyPaymentsWidget,
  render: (args) => ({
    props: args,
    template: `
      <app-monthly-payments-widget
        [title]="title"
        [payments]="payments"
        [rows]="rows"
        [showPaymentActions]="showPaymentActions"
        [currencyCode]="currencyCode"
        [currencyDisplay]="currencyDisplay"
        [currencyDigits]="currencyDigits"
        [emptyMessage]="emptyMessage"
        (paymentSelected)="paymentSelected($event)"
      />
    `,
  }),
  title: 'dashboard/ng/banking/components/monthly-payments-widget',
};

export default meta;

type Story = StoryObj<MonthlyPaymentsWidget>;

/** Default Monthly Payments Widget state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render payment rows and statuses', async () => {
      await expect(canvas.getByText('Monthly Payments')).toBeVisible();
      await expect(canvas.getByText('Recruiter Platform Seat')).toBeVisible();
      await expect(canvas.getByText('Candidate Screening')).toBeVisible();
      await expect(canvas.getAllByText('COMPLETED')[0]).toBeVisible();
      await expect(canvas.getByText('PENDING')).toBeVisible();
    });

    await step('emit the selected payment action', async () => {
      paymentSelected.mockClear();

      await userEvent.click(canvas.getByRole('button', { name: /view candidate screening payment/i }));

      await expect(paymentSelected).toHaveBeenCalledWith({
        payment: expect.objectContaining({ id: 'candidate-screening', name: 'Candidate Screening' }),
      });
    });
  },
};
