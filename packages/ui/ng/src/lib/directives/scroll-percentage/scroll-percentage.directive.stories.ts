import { type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { ScrollPercentageDirective } from './scroll-percentage.directive';

const scrollPercentageChange = fn();

const meta: Meta<ScrollPercentageDirective> = {
  argTypes: {
    scrollPercentageChange: {
      action: 'scrollPercentageChange',
      description: 'Emits the 0-100 visible percentage when the window scrolls.',
      table: { category: 'Outputs' },
    },
  },
  args: {
    scrollPercentageChange,
  },
  component: ScrollPercentageDirective,
  decorators: [
    moduleMetadata({
      imports: [ScrollPercentageDirective],
    }),
  ],
  title: 'ui/ng/scroll-percentage',
};

export default meta;

type Story = StoryObj<ScrollPercentageDirective>;

/** Host element demonstrating Scroll Percentage Directive. */
export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `<div kitScrollPercentage (scrollPercentageChange)="scrollPercentageChange($event)" style="padding: 1rem;">
      Candidate application activity
    </div>`,
  }),
  play: async ({ canvas, step }) => {
    await step('emit the visible percentage on scroll', async () => {
      const host = canvas.getByText('Candidate application activity') as HTMLElement;
      scrollPercentageChange.mockClear();
      host.getBoundingClientRect = () =>
        ({
          bottom: window.innerHeight + 100,
          height: 200,
          left: 0,
          right: 300,
          top: window.innerHeight - 100,
          width: 300,
          x: 0,
          y: window.innerHeight - 100,
          toJSON: () => ({}),
        }) as DOMRect;

      window.dispatchEvent(new Event('scroll'));

      await expect(scrollPercentageChange).toHaveBeenCalledWith(50);
    });
  },
};
