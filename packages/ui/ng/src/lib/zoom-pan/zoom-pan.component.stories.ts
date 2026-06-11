import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { ZoomPanComponent } from './zoom-pan.component';

const zoomChange = fn();
const panXChange = fn();
const panYChange = fn();

const meta: Meta<ZoomPanComponent> = {
  argTypes: {
    maxZoom: {
      control: { type: 'number', min: 1, max: 10, step: 0.25 },
      description: 'Maximum allowed zoom level.',
      table: { category: 'Inputs' },
    },
    minZoom: {
      control: { type: 'number', min: 0.25, max: 2, step: 0.25 },
      description: 'Minimum allowed zoom level.',
      table: { category: 'Inputs' },
    },
    panX: {
      control: { type: 'number', step: 1 },
      description: 'Current horizontal pan offset in pixels.',
      table: { category: 'Models' },
    },
    panXChange: {
      action: 'panXChange',
      description: 'Emitted when the horizontal pan offset changes.',
      table: { category: 'Model outputs' },
    },
    panY: {
      control: { type: 'number', step: 1 },
      description: 'Current vertical pan offset in pixels.',
      table: { category: 'Models' },
    },
    panYChange: {
      action: 'panYChange',
      description: 'Emitted when the vertical pan offset changes.',
      table: { category: 'Model outputs' },
    },
    zoom: {
      control: { type: 'number', min: 0.25, max: 10, step: 0.05 },
      description: 'Current zoom level.',
      table: { category: 'Models' },
    },
    zoomChange: {
      action: 'zoomChange',
      description: 'Emitted when the zoom level changes.',
      table: { category: 'Model outputs' },
    },
  },
  args: {
    maxZoom: 4,
    minZoom: 0.75,
    panX: -24,
    panXChange,
    panY: -16,
    panYChange,
    zoom: 1.25,
    zoomChange,
  },
  component: ZoomPanComponent,
  render: (args) => ({
    props: args,
    template: `
      <div style="height: 20rem; width: 28rem; border: 1px solid #cbd5e1">
        <kit-zoom-pan
          [zoom]="zoom"
          (zoomChange)="zoom = $event; zoomChange($event)"
          [panX]="panX"
          (panXChange)="panX = $event; panXChange($event)"
          [panY]="panY"
          (panYChange)="panY = $event; panYChange($event)"
          [minZoom]="minZoom"
          [maxZoom]="maxZoom"
        >
          <div style="height: 100%; width: 100%; display: grid; place-items: center; background: #eef2ff">
            Candidate pipeline canvas
          </div>
        </kit-zoom-pan>
      </div>
    `,
  }),
  title: 'ui/ng/zoom-pan',
};

export default meta;

type Story = StoryObj<ZoomPanComponent>;

/** Default Zoom Pan Component state. */
export const Default: Story = {
  play: async ({ canvas, canvasElement, step, userEvent }) => {
    await step('render projected zoomable content', async () => {
      await expect(canvas.getByText('Candidate pipeline canvas')).toBeVisible();
      await expect(canvasElement.querySelector('.zoom-content')).toHaveStyle(
        'transform: translate(-24px, -16px) scale(1.25)',
      );
    });

    await step('reset pan and zoom on double click', async () => {
      const wrapper = canvasElement.querySelector('.zoom-wrapper');
      const content = canvasElement.querySelector('.zoom-content');

      zoomChange.mockClear();
      panXChange.mockClear();
      panYChange.mockClear();

      await userEvent.dblClick(wrapper as Element);

      await expect(zoomChange).toHaveBeenCalledWith(1);
      await expect(panXChange).toHaveBeenCalledWith(0);
      await expect(panYChange).toHaveBeenCalledWith(0);
      await expect(content).toHaveStyle('transform: translate(0px, 0px) scale(1)');
    });
  },
};
