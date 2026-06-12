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
    props: {
      ...args,
      visibilityPercentage: 0,
    },
    template: `<section style="min-height: 160vh; padding: 2rem; background: linear-gradient(180deg, #f8fafc 0%, #ede9fe 52%, #fdf2f8 100%); color: #0f172a;">
      <div style="position: sticky; top: 1rem; z-index: 1; max-width: 38rem; margin: 0 auto; padding: 1rem; border: 1px solid #ddd6fe; border-radius: 0.5rem; background: rgba(255, 255, 255, 0.92); box-shadow: 0 0.75rem 2rem rgba(15, 23, 42, 0.12);">
        <p style="margin: 0; color: #7c3aed; font-size: 0.8125rem; font-weight: 700; text-transform: uppercase;">Observed application coverage</p>
        <p style="margin: 0.35rem 0 0; font-size: 1.5rem; font-weight: 800;"><span data-testid="visibility-percentage-value">{{ visibilityPercentage }}</span>% visible</p>
      </div>

      <div style="height: 24rem;"></div>

      <article
        data-testid="visibility-percentage-target"
        kitVisibilityPercentage
        (visibilityChange)="visibilityPercentage = $event; visibilityChange($event)"
        style="height: 12rem; max-width: 36rem; margin: 0 auto 44rem; padding: 1.25rem; border: 1px solid #c4b5fd; border-radius: 0.5rem; background: #ffffff; box-shadow: 0 1.25rem 3rem rgba(91, 33, 182, 0.15);"
      >
        <p style="margin: 0 0 0.5rem; color: #7c3aed; font-size: 0.8125rem; font-weight: 700;">Candidate application activity</p>
        <h3 style="margin: 0; font-size: 1.25rem; line-height: 1.25;">Panel interview packet</h3>
        <p style="margin: 0.75rem 0 0; color: #475569;">Intersection updates are reflected in the readout and emitted through the Storybook action callback.</p>
      </article>
    </section>`,
  }),
  play: async ({ canvas, step }) => {
    await step('render the visibility-observed host content', async () => {
      await expect(canvas.getByText('Candidate application activity')).toBeVisible();
      await expect(canvas.getByTestId('visibility-percentage-value')).toBeVisible();
      await expect(canvas.getByTestId('visibility-percentage-target')).toBeVisible();
    });
  },
};
