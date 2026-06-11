import { type Meta, type StoryObj } from '@storybook/angular';
import { createStorybookChartArgTypes } from '@otwld/ng-storybook';
import { expect, fn } from 'storybook/test';
import { type SalesByCategoryItem, SalesByCategoryWidget } from './sales-by-category-widget';

const dataSelected = fn();

const categories: readonly SalesByCategoryItem[] = [
  { id: 'job-offers', label: 'JobOffers', value: 300, tone: 'primary-700' },
  { id: 'candidate-services', label: 'Candidate Services', value: 150, tone: 'primary-400' },
  { id: 'interviews', label: 'Interviews', value: 100, tone: 'primary-100' },
];

const meta: Meta<SalesByCategoryWidget> = {
  argTypes: createStorybookChartArgTypes({
    dataInput: {
      name: 'categories',
      description: 'Category slices rendered by the chart.',
    },
    dataOutput: {
      name: 'dataSelected',
    },
    emptyMessageDescription: 'Message shown when no categories are available.',
    includeLabels: false,
    titleDescription: 'Heading shown above the sales-by-category chart.',
  }),
  args: {
    categories,
    chartClass: 'h-[300px]',
    colorScheme: 'light',
    dataSelected,
    emptyMessage: 'No category sales to display.',
    options: null,
    themeKey: null,
  title: 'dashboard/ng/ecommerce/sales-by-category-widget',
  },
  component: SalesByCategoryWidget,
  render: (args) => ({
    props: args,
    template: `
      <app-sales-by-category-widget
        [title]="title"
        [categories]="categories"
        [themeKey]="themeKey"
        [colorScheme]="colorScheme"
        [options]="options"
        [chartClass]="chartClass"
        [emptyMessage]="emptyMessage"
        (dataSelected)="dataSelected($event)"
      />
    `,
  }),
  title: 'dashboard/ng/ecommerce/sales-by-category-widget',
};

export default meta;

type Story = StoryObj<SalesByCategoryWidget>;

/** Default Sales By Category Widget state. */
export const Default: Story = {
  play: async ({ canvas, canvasElement, step }) => {
    await step('render the category pie chart', async () => {
      await expect(canvas.getByText('Sales by Category')).toBeVisible();
      await expect(canvasElement.querySelector('canvas')).toBeVisible();
    });
  },
};
