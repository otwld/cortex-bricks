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
    template: `<section style="min-height: 150vh; padding: 2rem; background: linear-gradient(180deg, #f8fafc 0%, #e0f2fe 48%, #ecfeff 100%); color: #0f172a;">
      <div style="max-width: 42rem; margin: 0 auto 18rem;">
        <p style="margin: 0 0 0.5rem; color: #0369a1; font-size: 0.875rem; font-weight: 700; text-transform: uppercase;">Recruiter review queue</p>
        <h2 style="margin: 0; font-size: 1.75rem; line-height: 1.2;">Candidate application activity</h2>
        <p style="margin: 0.75rem 0 0; color: #475569; font-size: 1rem;">Applications fade between the configured opacity limits as the review card enters the viewport.</p>
      </div>

      <article
        data-testid="scroll-opacity-target"
        kitScrollOpacity
        [minOpacity]="minOpacity"
        [maxOpacity]="maxOpacity"
        style="max-width: 36rem; margin: 0 auto 44rem; padding: 1.25rem; border: 1px solid #93c5fd; border-radius: 0.5rem; background: #ffffff; box-shadow: 0 1.25rem 3rem rgba(15, 23, 42, 0.16);"
      >
        <p style="margin: 0 0 0.5rem; color: #2563eb; font-size: 0.8125rem; font-weight: 700;">Candidate profile</p>
        <h3 style="margin: 0; font-size: 1.25rem; line-height: 1.25;">Maya Chen - Senior Angular Engineer</h3>
        <p style="margin: 0.75rem 0 0; color: #475569;">Application is ready for recruiter review, with interview availability and skill tags already attached.</p>
      </article>
    </section>`,
  }),
  play: async ({ canvas, step }) => {
    await step('render the opacity-tracked host content', async () => {
      await expect(canvas.getByText('Candidate application activity')).toBeVisible();
      await expect(canvas.getByTestId('scroll-opacity-target')).toBeVisible();
    });
  },
};
