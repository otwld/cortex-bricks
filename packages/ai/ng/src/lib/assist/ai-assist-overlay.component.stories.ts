import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { AiAssistOverlay } from './ai-assist-overlay.component';

const acceptRequested = fn();
const cancelRequested = fn();
const retryRequested = fn();
const runRequested = fn();

const meta: Meta<AiAssistOverlay> = {
  argTypes: {
    acceptRequested: {
      action: 'acceptRequested',
      description: 'Emitted when the recruiter accepts the generated candidate note.',
      table: { category: 'Outputs' },
    },
    cancelRequested: {
      action: 'cancelRequested',
      description: 'Emitted when the recruiter cancels the assist session.',
      table: { category: 'Outputs' },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the floating assist trigger.',
      table: { category: 'Inputs' },
    },
    label: {
      control: 'text',
      description: 'Accessible label for the floating assist trigger.',
      table: { category: 'Inputs' },
    },
    retryRequested: {
      action: 'retryRequested',
      description: 'Emitted when the recruiter retries generation.',
      table: { category: 'Outputs' },
    },
    runRequested: {
      action: 'runRequested',
      description: 'Emitted when the overlay first opens from the idle state.',
      table: { category: 'Outputs' },
    },
  },
  args: {
    acceptRequested,
    cancelRequested,
    disabled: false,
    label: 'Improve candidate notes',
    retryRequested,
    runRequested,
  },
  component: AiAssistOverlay,
  render: (args) => ({
    props: args,
    template: `<ai-assist-overlay
      [disabled]="disabled"
      [label]="label"
      (acceptRequested)="acceptRequested($event)"
      (cancelRequested)="cancelRequested($event)"
      (retryRequested)="retryRequested($event)"
      (runRequested)="runRequested($event)"
    ></ai-assist-overlay>`,
  }),
  title: 'ai/ng/assist/ai-assist-overlay',
};

export default meta;

type Story = StoryObj<AiAssistOverlay>;

/** Default AI Assist Overlay state. */
export const Default: Story = {
  play: async ({ canvas, step }) => {
    await step('keep the assist trigger hidden until a host requests it', async () => {
      await expect(canvas.queryByRole('button', { name: /improve candidate notes/i })).not.toBeInTheDocument();
    });
  },
};
