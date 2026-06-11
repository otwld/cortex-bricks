import { type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { ScrollOpacityDirective } from './scroll-opacity.directive';

const meta: Meta<ScrollOpacityDirective> = {
  argTypes: {
    maxOpacity: {
      control: { type: 'range', min: 0, max: 1, step: 0.05 },
      description: 'Maximum opacity applied when the host is fully visible.',
      table: { category: 'Inputs' },
    },
    minOpacity: {
      control: { type: 'range', min: 0, max: 1, step: 0.05 },
      description: 'Minimum opacity applied when the host is outside the viewport.',
      table: { category: 'Inputs' },
    },
  },
  args: {
    maxOpacity: 1,
    minOpacity: 0.25,
  },
  component: ScrollOpacityDirective,
  decorators: [
    moduleMetadata({
      imports: [ScrollOpacityDirective],
    }),
  ],
  title: 'ui/ng/scroll-opacity',
};

export default meta;

type Story = StoryObj<ScrollOpacityDirective>;

/** Host element demonstrating Scroll Opacity Directive. */
export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `<div kitScrollOpacity [minOpacity]="minOpacity" [maxOpacity]="maxOpacity" style="padding: 1rem;">
      Candidate application activity
    </div>`,
  }),
  play: async ({ canvas, step }) => {
    await step('render the opacity-tracked host content', async () => {
      await expect(canvas.getByText('Candidate application activity')).toBeVisible();
    });
  },
};
