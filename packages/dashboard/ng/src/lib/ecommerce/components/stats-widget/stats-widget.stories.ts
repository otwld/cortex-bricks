import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { type StatsMetric, StatsWidget } from './stats-widget';

const metricSelected = fn();

const metrics: readonly StatsMetric[] = [
  {
    id: 'job-offers',
    label: 'JobOffers',
    value: '120',
    changeLabel: '+12%',
    changeDirection: 'up',
    changeTone: 'green',
    visual: { type: 'sparkline', path: 'M1 20L20 15L40 18L60 8L80 12', viewBox: '0 0 82 24', tone: 'primary', strokeWidth: 2 },
  },
  {
    id: 'applications',
    label: 'Applications',
    value: '360',
    changeLabel: '+24%',
    changeDirection: 'up',
    changeTone: 'green',
    visual: { type: 'sparkline', path: 'M1 18L20 10L40 12L60 7L80 4', viewBox: '0 0 82 24', tone: 'cyan', strokeWidth: 2 },
  },
  {
    id: 'contracts',
    label: 'Contracts',
    value: '82',
    changeLabel: '+8%',
    changeDirection: 'flat',
    changeTone: 'gray',
    visual: { type: 'knob', value: 82, valueTemplate: '82%', size: 90, strokeWidth: 2, ariaLabel: 'Contract completion' },
  },
];

const meta: Meta<StatsWidget> = {
  argTypes: {
    metricSelected: {
      action: 'metricSelected',
      description: 'Emitted when a metric card action is selected.',
      table: { category: 'Outputs' },
    },
    metrics: {
      control: 'object',
      description: 'Metric cards rendered by the widget.',
      table: { category: 'Inputs' },
    },
    showMetricActions: {
      control: 'boolean',
      description: 'Whether per-metric action buttons are rendered.',
      table: { category: 'Inputs' },
    },
  },
  args: {
    metricSelected,
    metrics,
    showMetricActions: true,
  },
  component: StatsWidget,
  render: (args) => ({
    props: args,
    template: `
      <div class="grid grid-cols-12 gap-8">
        <app-stats-widget
          [metrics]="metrics"
          [showMetricActions]="showMetricActions"
          (metricSelected)="metricSelected($event)"
        />
      </div>
    `,
  }),
  title: 'dashboard/ng/ecommerce/components/stats-widget',
};

export default meta;

type Story = StoryObj<StatsWidget>;

/** Default Stats Widget state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render metric cards', async () => {
      await expect(canvas.getByText('JobOffers')).toBeVisible();
      await expect(canvas.getByText('Applications')).toBeVisible();
      await expect(canvas.getByText('Contracts')).toBeVisible();
      await expect(canvas.getByLabelText('Contract completion')).toBeVisible();
    });

    await step('emit a selected metric action', async () => {
      metricSelected.mockClear();

      await userEvent.click(canvas.getByRole('button', { name: /view applications metric/i }));

      await expect(metricSelected).toHaveBeenCalledWith({
        metric: expect.objectContaining({ id: 'applications', label: 'Applications' }),
      });
    });
  },
};
