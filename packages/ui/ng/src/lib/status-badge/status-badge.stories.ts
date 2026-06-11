import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { StatusBadgeComponent } from './status-badge';

const meta: Meta<StatusBadgeComponent> = {
  argTypes: {
    ariaLabel: {
      control: 'text',
      description: 'Accessible label applied to the badge host.',
      table: { category: 'Inputs' },
    },
    label: {
      control: 'text',
      description: 'Visible status text.',
      table: { category: 'Inputs' },
    },
    size: {
      control: 'inline-radio',
      description: 'Badge size.',
      options: ['sm', 'md', 'lg'],
      table: { category: 'Inputs' },
    },
    tone: {
      control: 'select',
      description: 'Visual status tone.',
      options: ['neutral', 'positive', 'info', 'warning', 'negative'],
      table: { category: 'Inputs' },
    },
  },
  args: {
    ariaLabel: 'Candidate status: Interview scheduled',
    label: 'Interview scheduled',
    size: 'md',
    tone: 'positive',
  },
  component: StatusBadgeComponent,
  parameters: {
    actions: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<kit-status-badge [label]="label" [tone]="tone" [size]="size" [ariaLabel]="ariaLabel" />`,
  }),
  title: 'ui/ng/status-badge',
};

export default meta;

type Story = StoryObj<StatusBadgeComponent>;

/** Default Status Badge Component state. */
export const Default: Story = {
  play: async ({ canvas, step }) => {
    await step('render status text with accessible context', async () => {
      const badge = canvas.getByText('Interview scheduled');

      await expect(badge).toBeVisible();
      await expect(badge).toHaveAttribute('aria-label', 'Candidate status: Interview scheduled');
    });
  },
};
