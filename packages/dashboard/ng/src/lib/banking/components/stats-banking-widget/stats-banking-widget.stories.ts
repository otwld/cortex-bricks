import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { type BankingStatCard, StatsBankingWidget } from './stats-banking-widget';

const cardSelected = fn();

const cards: readonly BankingStatCard[] = [
  {
    id: 'debit-card',
    title: 'dashboard/ng/banking/components/stats-banking-widget',
    label: 'Balance',
    value: '$2,000.00',
    number: '**** **** **** 1412',
    expiry: '12/26',
    variant: 'debit',
  },
  {
    id: 'candidate-screening',
    title: 'dashboard/ng/banking/components/stats-banking-widget',
    value: '$24,345.21',
    icon: 'pi pi-dollar',
    variant: 'summary',
  },
  {
    id: 'interview-budget',
    title: 'dashboard/ng/banking/components/stats-banking-widget',
    value: '$10,416.11',
    icon: 'pi pi-calendar',
    variant: 'summary',
  },
];

const meta: Meta<StatsBankingWidget> = {
  argTypes: {
    cardSelected: {
      action: 'cardSelected',
      description: 'Emitted when a stat card action is selected.',
      table: { category: 'Outputs' },
    },
    cards: {
      control: 'object',
      description: 'Banking cards and account summaries rendered by the widget.',
      table: { category: 'Inputs' },
    },
    showCardActions: {
      control: 'boolean',
      description: 'Whether per-card action buttons are rendered.',
      table: { category: 'Inputs' },
    },
  },
  args: {
    cardSelected,
    cards,
    showCardActions: true,
  },
  component: StatsBankingWidget,
  render: (args) => ({
    props: args,
    template: `
      <div class="grid grid-cols-12 gap-8">
        <app-stats-banking-widget
          [cards]="cards"
          [showCardActions]="showCardActions"
          (cardSelected)="cardSelected($event)"
        />
      </div>
    `,
  }),
  title: 'dashboard/ng/banking/components/stats-banking-widget',
};

export default meta;

type Story = StoryObj<StatsBankingWidget>;

/** Default Stats Banking Widget state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render banking stat cards', async () => {
      await expect(canvas.getByText('Recruiter Wallet')).toBeVisible();
      await expect(canvas.getByText('Candidate Screening')).toBeVisible();
      await expect(canvas.getByText('Interview Budget')).toBeVisible();
    });

    await step('emit the selected stat card action', async () => {
      cardSelected.mockClear();

      await userEvent.click(canvas.getByRole('button', { name: /view candidate screening/i }));

      await expect(cardSelected).toHaveBeenCalledWith({
        card: expect.objectContaining({ id: 'candidate-screening', title: 'dashboard/ng/banking/components/stats-banking-widget' }),
      });
    });
  },
};
