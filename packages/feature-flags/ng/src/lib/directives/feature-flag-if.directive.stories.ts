import { type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import type { FeatureFlagScope } from '../feature-flags.types';
import { FeatureFlagsService } from '../feature-flags.service';
import { FeatureFlagIfDirective } from './feature-flag-if.directive';

const isEnabled = fn(() => true);

const meta: Meta<FeatureFlagIfDirective> = {
  argTypes: {
    feature: {
      control: 'text',
      description: 'Feature slug to evaluate.',
      table: { category: 'Inputs' },
    },
    scope: {
      control: 'inline-radio',
      description: 'Feature flag scope to evaluate.',
      options: ['app', 'user'],
      table: { category: 'Inputs' },
    },
  },
  args: {
    feature: 'candidate-profile-notes',
    scope: 'app' satisfies FeatureFlagScope,
  },
  component: FeatureFlagIfDirective,
  decorators: [
    moduleMetadata({
      imports: [FeatureFlagIfDirective],
      providers: [
        {
          provide: FeatureFlagsService,
          useValue: {
            isEnabled,
          },
        },
      ],
    }),
  ],
  title: 'feature-flags/ng/feature-flag-if',
};

export default meta;

type Story = StoryObj<FeatureFlagIfDirective>;

/** Enabled feature flag branch for recruiter-only candidate notes. */
export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `<section *featureFlagIf="feature; featureFlagIfScope: scope">
      Candidate profile notes are visible to recruiters.
    </section>`,
  }),
  play: async ({ canvas, step }) => {
    await step('render content when the feature is enabled', async () => {
      await expect(isEnabled).toHaveBeenCalledWith('candidate-profile-notes', 'app');
      await expect(canvas.getByText(/candidate profile notes are visible/i)).toBeVisible();
    });
  },
};
