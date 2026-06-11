import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { BannerComponent } from './banner';

const meta: Meta<BannerComponent> = {
  argTypes: {
    ariaLabel: {
      control: 'text',
      description: 'Accessible label applied to the banner host.',
      table: { category: 'Inputs' },
    },
    tone: {
      control: 'select',
      description: 'Visual tone for the banner surface.',
      options: ['neutral', 'positive', 'info', 'warning', 'negative'],
      table: { category: 'Inputs' },
    },
  },
  args: {
    ariaLabel: 'Candidate sync status',
    tone: 'info',
  },
  component: BannerComponent,
  parameters: {
    actions: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `
      <kit-banner [tone]="tone" [ariaLabel]="ariaLabel">
        <span kit-banner-title>Candidate sync ready</span>
        <span kit-banner-body>New candidate records are available for review.</span>
        <button kit-banner-actions type="button">Review</button>
      </kit-banner>
    `,
  }),
  title: 'ui/ng/banner',
};

export default meta;

type Story = StoryObj<BannerComponent>;

/** Default Banner Component state. */
export const Default: Story = {
  play: async ({ canvas, canvasElement, step }) => {
    await step('render projected banner content with an accessible label', async () => {
      const banner = canvasElement.querySelector('kit-banner');

      await expect(canvas.getByText('Candidate sync ready')).toBeVisible();
      await expect(canvas.getByText(/new candidate records/i)).toBeVisible();
      await expect(canvas.getByRole('button', { name: /review/i })).toBeVisible();
      await expect(banner).toHaveAttribute('aria-label', 'Candidate sync status');
    });
  },
};
