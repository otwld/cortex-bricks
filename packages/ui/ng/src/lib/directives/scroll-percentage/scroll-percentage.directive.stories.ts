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
    props: {
      ...args,
      scrollPercentage: 0,
    },
    template: `<section style="min-height: 160vh; padding: 2rem; background: linear-gradient(180deg, #f8fafc 0%, #ecfdf5 54%, #f0fdfa 100%); color: #0f172a;">
      <div style="position: sticky; top: 1rem; z-index: 1; max-width: 38rem; margin: 0 auto; padding: 1rem; border: 1px solid #bbf7d0; border-radius: 0.5rem; background: rgba(255, 255, 255, 0.92); box-shadow: 0 0.75rem 2rem rgba(15, 23, 42, 0.12);">
        <p style="margin: 0; color: #047857; font-size: 0.8125rem; font-weight: 700; text-transform: uppercase;">Application viewport coverage</p>
        <p style="margin: 0.35rem 0 0; font-size: 1.5rem; font-weight: 800;"><span data-testid="scroll-percentage-value">{{ scrollPercentage }}</span>% visible</p>
      </div>

      <div style="height: 24rem;"></div>

      <article
        data-testid="scroll-percentage-target"
        kitScrollPercentage
        (scrollPercentageChange)="scrollPercentage = $event; scrollPercentageChange($event)"
        style="height: 12rem; max-width: 36rem; margin: 0 auto 44rem; padding: 1.25rem; border: 1px solid #86efac; border-radius: 0.5rem; background: #ffffff; box-shadow: 0 1.25rem 3rem rgba(22, 101, 52, 0.14);"
      >
        <p style="margin: 0 0 0.5rem; color: #16a34a; font-size: 0.8125rem; font-weight: 700;">Candidate application activity</p>
        <h3 style="margin: 0; font-size: 1.25rem; line-height: 1.25;">Interview readiness review</h3>
        <p style="margin: 0.75rem 0 0; color: #475569;">The emitted percentage tracks how much of this application card is visible in the browser viewport.</p>
      </article>
    </section>`,
  }),
  play: async ({ canvas, step }) => {
    await step('emit the visible percentage on scroll', async () => {
      const host = canvas.getByTestId('scroll-percentage-target') as HTMLElement;
      const value = canvas.getByTestId('scroll-percentage-value');

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
      await expect(value).toHaveTextContent('50');
    });
  },
};
