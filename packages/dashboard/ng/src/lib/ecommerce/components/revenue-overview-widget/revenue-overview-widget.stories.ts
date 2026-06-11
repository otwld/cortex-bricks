import { type Meta, type StoryObj } from '@storybook/angular';
import { createStorybookChartArgTypes } from '@otwld/ng-storybook';
import { expect, fn, within } from 'storybook/test';
import {
  type RevenueOverviewPeriod,
  RevenueOverviewWidget,
} from './revenue-overview-widget';

const dataSelected = fn();
const periodSelected = fn();

const labels = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

const periods: readonly RevenueOverviewPeriod[] = [
  {
    id: 'last-week',
    label: 'Last Week',
    series: [
      { id: 'revenue', label: 'Revenue', tone: 'primary', data: [65, 59, 80, 81, 56] },
      { id: 'applications', label: 'Applications', tone: 'primary-soft', data: [28, 48, 40, 19, 46] },
    ],
  },
  {
    id: 'this-week',
    label: 'This Week',
    series: [
      { id: 'revenue', label: 'Revenue', tone: 'primary', data: [35, 49, 60, 71, 66] },
      { id: 'applications', label: 'Applications', tone: 'primary-soft', data: [18, 38, 30, 29, 36] },
    ],
  },
];

const meta: Meta<RevenueOverviewWidget> = {
  argTypes: {
    ...createStorybookChartArgTypes({
      dataInput: {
        name: 'periods',
        description: 'Selectable revenue periods and their chart series.',
      },
      dataOutput: {
        name: 'dataSelected',
      },
      emptyMessageDescription: 'Message shown when the selected period has no series.',
      labelsDescription: 'Labels rendered on the x-axis.',
      titleDescription: 'Heading shown above the revenue overview chart.',
    }),
    periodSelectAriaLabel: {
      control: 'text',
      description: 'Accessible label for the period select.',
      table: { category: 'Inputs' },
    },
    periodSelectDisabled: {
      control: 'boolean',
      description: 'Controls whether the period select can be changed.',
      table: { category: 'Inputs' },
    },
    periodSelected: {
      action: 'periodSelected',
      description: 'Emitted when the user selects a different period.',
      table: { category: 'Outputs' },
    },
    selectedPeriodId: {
      control: 'text',
      description: 'Optional controlled selected period id.',
      table: { category: 'Inputs' },
    },
    showPeriodSelector: {
      control: 'boolean',
      description: 'Controls whether the period select is rendered.',
      table: { category: 'Inputs' },
    },
  },
  args: {
    chartClass: 'h-[300px]',
    colorScheme: 'light',
    dataSelected,
    emptyMessage: 'No revenue data to display.',
    labels,
    options: null,
    periodSelectAriaLabel: 'Select revenue period',
    periodSelectDisabled: false,
    periodSelected,
    periods,
    selectedPeriodId: null,
    showPeriodSelector: true,
    themeKey: null,
  title: 'dashboard/ng/ecommerce/revenue-overview-widget',
  },
  component: RevenueOverviewWidget,
  render: (args) => ({
    props: args,
    template: `
      <app-revenue-overview-widget
        [title]="title"
        [labels]="labels"
        [periods]="periods"
        [selectedPeriodId]="selectedPeriodId"
        [themeKey]="themeKey"
        [colorScheme]="colorScheme"
        [options]="options"
        [chartClass]="chartClass"
        [showPeriodSelector]="showPeriodSelector"
        [periodSelectDisabled]="periodSelectDisabled"
        [periodSelectAriaLabel]="periodSelectAriaLabel"
        [emptyMessage]="emptyMessage"
        (periodSelected)="periodSelected($event)"
        (dataSelected)="dataSelected($event)"
      />
    `,
  }),
  title: 'dashboard/ng/ecommerce/revenue-overview-widget',
};

export default meta;

type Story = StoryObj<RevenueOverviewWidget>;

/** Default Revenue Overview Widget state. */
export const Default: Story = {
  play: async ({ canvas, canvasElement, step, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await step('render chart and period selector', async () => {
      await expect(canvas.getByText('Revenue Overview')).toBeVisible();
      await expect(canvas.getByText('Last Week')).toBeVisible();
      await expect(canvasElement.querySelector('canvas')).toBeVisible();
    });

    await step('emit a selected period action', async () => {
      periodSelected.mockClear();

      await userEvent.click(canvas.getByLabelText(/select revenue period/i));
      await userEvent.click(await body.findByText('This Week'));

      await expect(periodSelected).toHaveBeenCalledWith({
        period: expect.objectContaining({ id: 'this-week', label: 'This Week' }),
      });
    });
  },
};
