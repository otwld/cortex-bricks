import { type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { VisibilityPercentageDirective } from './visibility-percentage.directive';

const visibilityChange = fn();

const meta: Meta<VisibilityPercentageDirective> = {
  argTypes: {
    visibilityChange: {
      action: 'visibilityChange',
      description: 'Emits the rounded 0-100 intersection percentage.',
      table: { category: 'Outputs' },
    },
  },
  args: {
    visibilityChange,
  },
  component: VisibilityPercentageDirective,
  decorators: [
    moduleMetadata({
      imports: [VisibilityPercentageDirective],
    }),
  ],
  title: 'ui/ng/visibility-percentage',
};

export default meta;

type Story = StoryObj<VisibilityPercentageDirective>;

/** Host element demonstrating Visibility Percentage Directive. */
export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `<div kitVisibilityPercentage (visibilityChange)="visibilityChange($event)" style="padding: 1rem;">
      Candidate application activity
    </div>`,
  }),
  play: async ({ canvas, step }) => {
    await step('render the visibility-observed host content', async () => {
      await expect(canvas.getByText('Candidate application activity')).toBeVisible();
    });
  },
};
