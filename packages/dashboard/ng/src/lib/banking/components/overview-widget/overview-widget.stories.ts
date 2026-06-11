import { type Meta, type StoryObj } from '@storybook/angular';
import { createStorybookChartArgTypes } from '@otwld/ng-storybook';
import { expect, fn } from 'storybook/test';
import { type BankingOverviewSeries, OverviewWidget } from './overview-widget';

const dataSelected = fn();

const labels = ['January', 'February', 'March', 'April', 'May', 'June'];

const series: readonly BankingOverviewSeries[] = [
  { id: 'job-offer-revenue', label: 'JobOffer Revenue', data: [6500, 5900, 8000, 8100, 7600, 8500], tone: 'green' },
  {
    id: 'candidate-expenses',
    label: 'Candidate Expenses',
    data: [1200, 3100, 4200, 3300, 2100, 3200],
    fill: true,
    tone: 'primary',
    backgroundColor: 'rgba(99,102,220,0.2)',
  },
];

const meta: Meta<OverviewWidget> = {
  argTypes: {
    ...createStorybookChartArgTypes({
      dataInput: {
        name: 'series',
        description: 'Line series rendered by the chart.',
      },
      dataOutput: {
        name: 'dataSelected',
      },
      emptyMessageDescription: 'Message shown when no overview series are available.',
      labelsDescription: 'Labels rendered on the x-axis.',
      titleDescription: 'Heading shown above the overview chart.',
    }),
    currencyCode: {
      control: 'text',
      description: 'Currency code used by the default tooltip formatter.',
      table: { category: 'Inputs' },
    },
    locale: {
      control: 'text',
      description: 'Locale used by the default tooltip formatter.',
      table: { category: 'Inputs' },
    },
  },
  args: {
    chartClass: 'h-80',
    colorScheme: 'light',
    currencyCode: 'USD',
    dataSelected,
    emptyMessage: 'No overview data to display.',
    labels,
    locale: 'en-US',
    options: null,
    series,
    themeKey: null,
    title: 'dashboard/ng/banking/components/overview-widget',
  },
  component: OverviewWidget,
  render: (args) => ({
    props: args,
    template: `
      <app-overview-widget
        [title]="title"
        [labels]="labels"
        [series]="series"
        [themeKey]="themeKey"
        [colorScheme]="colorScheme"
        [options]="options"
        [chartClass]="chartClass"
        [currencyCode]="currencyCode"
        [locale]="locale"
        [emptyMessage]="emptyMessage"
        (dataSelected)="dataSelected($event)"
      />
    `,
  }),
  title: 'dashboard/ng/banking/components/overview-widget',
};

export default meta;

type Story = StoryObj<OverviewWidget>;

/** Default Overview Widget state. */
export const Default: Story = {
  play: async ({ canvas, canvasElement, step }) => {
    await step('render the overview chart', async () => {
      await expect(canvas.getByText('Overview')).toBeVisible();
      await expect(canvasElement.querySelector('canvas')).toBeVisible();
    });
  },
};
