import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { BlockViewer } from './block-viewer';

const meta: Meta<BlockViewer> = {
  argTypes: {
    code: {
      control: 'text',
      description: 'Source code shown in the Code view.',
      table: { category: 'Inputs' },
    },
    containerClass: {
      control: 'text',
      description: 'CSS classes applied to the preview container.',
      table: { category: 'Inputs' },
    },
    free: {
      control: 'boolean',
      description: 'Shows the Free badge in the block header.',
      table: { category: 'Inputs' },
    },
    header: {
      control: 'text',
      description: 'Title displayed in the block header.',
      table: { category: 'Inputs' },
    },
    new: {
      control: 'boolean',
      description: 'Marks the block as new for consuming pages.',
      table: { category: 'Inputs' },
    },
    previewStyle: {
      control: 'object',
      description: 'Inline style object applied to the preview container.',
      table: { category: 'Inputs' },
    },
  },
  args: {
    code: `<section class="candidate-card">
  <h2>Aisha Patel</h2>
  <p>Senior Angular Engineer</p>
</section>`,
    containerClass: 'p-6 bg-surface-50 dark:bg-surface-900',
    free: true,
    header: 'Candidate Profile Card',
    new: false,
    previewStyle: {},
  },
  component: BlockViewer,
  render: (args) => ({
    props: {
      ...args,
      isNew: args.new,
    },
    template: `
      <app-block-viewer
        [header]="header"
        [code]="code"
        [containerClass]="containerClass"
        [previewStyle]="previewStyle"
        [free]="free"
        [new]="isNew"
      >
        <section class="rounded-lg border border-surface-200 bg-surface-0 p-4 dark:border-surface-700 dark:bg-surface-950">
          <h2 class="mb-1 text-lg font-semibold text-surface-950 dark:text-surface-0">Aisha Patel</h2>
          <p class="text-sm text-surface-500 dark:text-surface-400">Senior Angular Engineer</p>
        </section>
      </app-block-viewer>
    `,
  }),
  title: 'dashboard/ng/pages/blocks/block-viewer',
};

export default meta;

type Story = StoryObj<BlockViewer>;

/** Default Block Viewer state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render the projected block preview', async () => {
      await expect(canvas.getByText('Candidate Profile Card')).toBeVisible();
      await expect(canvas.getByText('Free')).toBeVisible();
      await expect(canvas.getByText('Aisha Patel')).toBeVisible();
      await expect(canvas.getByRole('button', { name: /copy block code/i })).toBeVisible();
    });

    await step('switch between code and preview views', async () => {
      await userEvent.click(canvas.getAllByRole('button', { name: /code/i })[0]);

      await expect(canvas.getByText(/candidate-card/i)).toBeVisible();

      await userEvent.click(canvas.getByRole('button', { name: /preview/i }));

      await expect(canvas.getByText('Senior Angular Engineer')).toBeVisible();
    });
  },
};
