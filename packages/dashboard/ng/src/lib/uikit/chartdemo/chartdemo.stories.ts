import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { ChartDemo } from './chartdemo';

const meta: Meta<ChartDemo> = {
  argTypes: {},
  component: ChartDemo,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-chart-demo></app-chart-demo>`,
  }),
  title: 'dashboard/ng/uikit/chartdemo',
};

export default meta;

type Story = StoryObj<ChartDemo>;

/** Default Chart Demo state. */
export const Default: Story = {
  play: async ({ canvas, canvasElement, step }) => {
    await step('render all chart panels', async () => {
      await expect(canvas.getByText('Linear')).toBeVisible();
      await expect(canvas.getByText('Bar')).toBeVisible();
      await expect(canvas.getByText('Pie')).toBeVisible();
      await expect(canvas.getByText('Doughnut')).toBeVisible();
      await expect(canvas.getByText('Polar Area')).toBeVisible();
      await expect(canvas.getByText('Radar')).toBeVisible();
    });

    await step('mount chart canvases after theme initialization', async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 100));

      await expect(canvasElement.querySelectorAll('canvas').length).toBeGreaterThanOrEqual(6);
    });
  },
};
