import { type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { StickyClassDirective } from './sticky-class.directive';

const meta: Meta<StickyClassDirective> = {
  argTypes: {
    stickyRoot: {
      control: false,
      description: 'Optional scroll root element. Disabled in this story because it is supplied by template reference.',
      table: { category: 'Inputs' },
    },
    stickyStuckClass: {
      control: 'text',
      description: 'CSS class applied when the sticky host is stuck.',
      table: { category: 'Inputs' },
    },
    stickyTop: {
      control: { type: 'number', min: 0, max: 128, step: 1 },
      description: 'Sticky offset in pixels.',
      table: { category: 'Inputs' },
    },
  },
  args: {
    stickyRoot: null,
    stickyStuckClass: 'is-stuck',
    stickyTop: 16,
  },
  component: StickyClassDirective,
  decorators: [
    moduleMetadata({
      imports: [StickyClassDirective],
    }),
  ],
  title: 'ui/ng/sticky-class',
};

export default meta;

type Story = StoryObj<StickyClassDirective>;

/** Host element demonstrating Sticky Class Directive. */
export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `<div style="height: 12rem; overflow: auto; border: 1px solid #cbd5e1;">
      <div
        kitStickyClass
        [stickyTop]="stickyTop"
        [stickyStuckClass]="stickyStuckClass"
        style="position: sticky; padding: 1rem; background: white;"
      >
        Candidate application activity
      </div>
      <div style="height: 24rem;"></div>
    </div>`,
  }),
  play: async ({ canvas, step }) => {
    await step('render the sticky host with the configured offset', async () => {
      const host = canvas.getByText('Candidate application activity');

      await expect(host).toBeVisible();
      await expect(host).toHaveStyle('top: 16px');
    });
  },
};
