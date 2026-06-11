import { type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { ScrollScaleDirective } from './scroll-scale.directive';

const meta: Meta<ScrollScaleDirective> = {
  argTypes: {
    maxScale: {
      control: { type: 'number', min: 1, max: 3, step: 0.05 },
      description: 'Maximum scale applied to the host element.',
      table: { category: 'Inputs' },
    },
    minScale: {
      control: { type: 'number', min: 0.25, max: 1, step: 0.05 },
      description: 'Minimum scale applied to the host element.',
      table: { category: 'Inputs' },
    },
    scaleFactor: {
      control: { type: 'number', min: 0, max: 0.5, step: 0.01 },
      description: 'Scale increment applied for each 100px of window scroll.',
      table: { category: 'Inputs' },
    },
  },
  args: {
    maxScale: 1.2,
    minScale: 1,
    scaleFactor: 0.05,
  },
  component: ScrollScaleDirective,
  decorators: [
    moduleMetadata({
      imports: [ScrollScaleDirective],
    }),
  ],
  title: 'ui/ng/scroll-scale',
};

export default meta;

type Story = StoryObj<ScrollScaleDirective>;

/** Host element demonstrating Scroll Scale Directive. */
export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `<div kitScrollScale [scaleFactor]="scaleFactor" [minScale]="minScale" [maxScale]="maxScale" style="padding: 1rem;">
      Candidate application activity
    </div>`,
  }),
  play: async ({ canvas, step }) => {
    await step('scale the host when the window scrolls', async () => {
      const host = canvas.getByText('Candidate application activity');
      const originalScrollY = window.scrollY;

      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        value: 300,
      });
      window.dispatchEvent(new Event('scroll'));

      await expect(host).toHaveStyle('transform: scale(1.15)');

      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        value: originalScrollY,
      });
    });
  },
};
