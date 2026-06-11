import { type Meta, type StoryObj } from '@storybook/angular';
import { createStorybookChartArgTypes } from '@otwld/ng-storybook';
import { expect, fn } from 'storybook/test';
import { type RevenueStreamSeries, RevenueStreamWidget } from './revenue-stream-widget';

const dataSelected = fn();

const labels = ['Q1', 'Q2', 'Q3', 'Q4'];

const series: readonly RevenueStreamSeries[] = [
  { id: 'job-offers', label: 'JobOffers', tone: 'primary-400', data: [4000, 10000, 15000, 4000], barThickness: 32 },
  { id: 'applications', label: 'Applications', tone: 'primary-300', data: [2100, 8400, 2400, 7500], barThickness: 32 },
  { id: 'contracts', label: 'Contracts', tone: 'primary-200', data: [4100, 5200, 3400, 7400], barThickness: 32, borderSkipped: false },
];

const meta: Meta<RevenueStreamWidget> = {
  argTypes: createStorybookChartArgTypes({
    dataInput: {
      name: 'series',
      description: 'Stacked revenue stream series rendered by the chart.',
    },
    dataOutput: {
      name: 'dataSelected',
    },
    emptyMessageDescription: 'Message shown when no series are available.',
    labelsDescription: 'Labels rendered on the x-axis.',
    titleDescription: 'Heading shown above the revenue stream chart.',
  }),
  args: {
    chartClass: 'h-80',
    colorScheme: 'light',
    dataSelected,
    emptyMessage: 'No revenue stream data to display.',
    labels,
    options: null,
    series,
    themeKey: null,
    title: 'Revenue Stream',
  },
  component: RevenueStreamWidget,
  render: (args) => ({
    props: args,
    template: `
      <app-revenue-stream-widget
        [title]="title"
        [labels]="labels"
        [series]="series"
        [themeKey]="themeKey"
        [colorScheme]="colorScheme"
        [options]="options"
        [chartClass]="chartClass"
        [emptyMessage]="emptyMessage"
        (dataSelected)="dataSelected($event)"
      />
    `,
  }),
  title: 'dashboard/ng/ecommerce/revenue-stream-widget',
};

export default meta;

type Story = StoryObj<RevenueStreamWidget>;

/** Default Revenue Stream Widget state. */
export const Default: Story = {
  play: async ({ canvas, canvasElement, step }) => {
    await step('render the stacked revenue stream chart', async () => {
      await expect(canvas.getByText('Revenue Stream')).toBeVisible();
      await expect(canvasElement.querySelector('canvas')).toBeVisible();
    });
  },
};
