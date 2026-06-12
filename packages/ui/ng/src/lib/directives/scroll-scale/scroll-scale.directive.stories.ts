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
    template: `<section style="min-height: 160vh; padding: 2rem; background: linear-gradient(180deg, #f8fafc 0%, #fef3c7 50%, #f0fdfa 100%); color: #0f172a;">
      <div style="max-width: 42rem; margin: 0 auto 20rem;">
        <p style="margin: 0 0 0.5rem; color: #b45309; font-size: 0.875rem; font-weight: 700; text-transform: uppercase;">Recruiter dashboard focus</p>
        <h2 style="margin: 0; font-size: 1.75rem; line-height: 1.2;">Candidate application activity</h2>
        <p style="margin: 0.75rem 0 0; color: #475569; font-size: 1rem;">The application card scales from the configured scroll factor, minimum scale, and maximum scale values.</p>
      </div>

      <div style="max-width: 42rem; margin: 0 auto 44rem; padding: 1.5rem; border: 1px dashed #f59e0b; border-radius: 0.5rem; background: rgba(255, 255, 255, 0.72);">
        <article
          data-testid="scroll-scale-target"
          kitScrollScale
          [scaleFactor]="scaleFactor"
          [minScale]="minScale"
          [maxScale]="maxScale"
          style="max-width: 34rem; margin: 0 auto; padding: 1.25rem; border: 1px solid #fbbf24; border-radius: 0.5rem; background: #ffffff; box-shadow: 0 1.25rem 3rem rgba(146, 64, 14, 0.16); transform-origin: center;"
        >
          <p style="margin: 0 0 0.5rem; color: #d97706; font-size: 0.8125rem; font-weight: 700;">Candidate profile</p>
          <h3 style="margin: 0; font-size: 1.25rem; line-height: 1.25;">Ari Patel - Platform Engineer</h3>
          <p style="margin: 0.75rem 0 0; color: #475569;">Application momentum increases as the recruiter scrolls through the review surface.</p>
        </article>
      </div>
    </section>`,
  }),
  play: async ({ canvas, step }) => {
    await step('scale the host when the window scrolls', async () => {
      const host = canvas.getByTestId('scroll-scale-target');
      const originalScrollY = window.scrollY;

      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        value: 300,
      });
      window.dispatchEvent(new Event('scroll'));

      await expect(host.style.transform).toBe('scale(1.15)');

      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        value: originalScrollY,
      });
    });
  },
};
