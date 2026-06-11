import { type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { AiCompletionService } from '../services/ai-completion.service';
import { AiAssistDirective } from './ai-assist.directive';

const aiAssistAccepted = fn();
const aiAssistCanceled = fn();
const aiAssistError = fn();
const aiAssistGenerated = fn();

const meta: Meta<AiAssistDirective> = {
  argTypes: {
    aiAssist: {
      control: 'text',
      description: 'Prompt used to improve the candidate notes.',
      table: { category: 'Inputs' },
    },
    aiAssistAccepted: {
      action: 'aiAssistAccepted',
      description: 'Emitted after generated text is applied to the host control.',
      table: { category: 'Outputs' },
    },
    aiAssistApplyMode: {
      control: 'select',
      description: 'How generated text is applied to the textarea.',
      options: ['replace', 'selection', 'append'],
      table: { category: 'Inputs' },
    },
    aiAssistCanceled: {
      action: 'aiAssistCanceled',
      description: 'Emitted when an assist session is cancelled.',
      table: { category: 'Outputs' },
    },
    aiAssistDisabled: {
      control: 'boolean',
      description: 'Disables AI assist on the host textarea.',
      table: { category: 'Inputs' },
    },
    aiAssistError: {
      action: 'aiAssistError',
      description: 'Emitted when generation fails.',
      table: { category: 'Outputs' },
    },
    aiAssistGenerated: {
      action: 'aiAssistGenerated',
      description: 'Emitted when a candidate-note suggestion is generated.',
      table: { category: 'Outputs' },
    },
    aiAssistLabel: {
      control: 'text',
      description: 'Accessible label for the floating AI assist trigger.',
      table: { category: 'Inputs' },
    },
    aiAssistMaxOutputTokens: {
      control: { type: 'number', min: 16, max: 512, step: 16 },
      description: 'Maximum generated token budget for the suggestion.',
      table: { category: 'Inputs' },
    },
    aiAssistMetadata: {
      control: 'object',
      description: 'Metadata sent with the generation request.',
      table: { category: 'Inputs' },
    },
    aiAssistModel: {
      control: 'text',
      description: 'Optional model override for the generation request.',
      table: { category: 'Inputs' },
    },
    aiAssistSystem: {
      control: 'text',
      description: 'Optional system prompt for the generation request.',
      table: { category: 'Inputs' },
    },
    aiAssistTemperature: {
      control: { type: 'number', min: 0, max: 2, step: 0.1 },
      description: 'Optional generation temperature.',
      table: { category: 'Inputs' },
    },
  },
  args: {
    aiAssist: 'Summarize this candidate for recruiter review.',
    aiAssistAccepted,
    aiAssistApplyMode: 'replace',
    aiAssistCanceled,
    aiAssistDisabled: false,
    aiAssistError,
    aiAssistGenerated,
    aiAssistLabel: 'Improve candidate notes',
    aiAssistMaxOutputTokens: 96,
    aiAssistMetadata: {
      source: 'storybook',
      workflow: 'candidate-notes',
    },
    aiAssistModel: undefined,
    aiAssistSystem: 'Return concise recruiting notes.',
    aiAssistTemperature: 0.2,
  },
  component: AiAssistDirective,
  decorators: [
    moduleMetadata({
      imports: [AiAssistDirective],
      providers: [
        {
          provide: AiCompletionService,
          useValue: {
            createCompletion: () => ({
              complete: async () => 'Candidate summary ready for recruiter review.',
              completion: '',
              error: undefined,
              loading: false,
              stop: () => undefined,
            }),
          },
        },
      ],
    }),
  ],
  title: 'ai/ng/assist/ai-assist',
};

export default meta;

type Story = StoryObj<AiAssistDirective>;

/** Textarea host with AI assist enabled for candidate notes. */
export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `<textarea
      aiAssist
      [aiAssist]="aiAssist"
      [aiAssistApplyMode]="aiAssistApplyMode"
      [aiAssistDisabled]="aiAssistDisabled"
      [aiAssistLabel]="aiAssistLabel"
      [aiAssistMaxOutputTokens]="aiAssistMaxOutputTokens"
      [aiAssistMetadata]="aiAssistMetadata"
      [aiAssistModel]="aiAssistModel"
      [aiAssistSystem]="aiAssistSystem"
      [aiAssistTemperature]="aiAssistTemperature"
      (aiAssistAccepted)="aiAssistAccepted($event)"
      (aiAssistCanceled)="aiAssistCanceled($event)"
      (aiAssistError)="aiAssistError($event)"
      (aiAssistGenerated)="aiAssistGenerated($event)"
      style="min-height: 8rem; width: 24rem;"
    >Candidate has strong Angular experience.</textarea>`,
  }),
  play: async ({ canvas, step, userEvent }) => {
    await step('edit the candidate notes host', async () => {
      const notes = canvas.getByRole('textbox');

      await expect(notes).toHaveValue('Candidate has strong Angular experience.');
      await userEvent.type(notes, ' Available for interviews next week.');
      await expect(notes).toHaveValue('Candidate has strong Angular experience. Available for interviews next week.');
    });
  },
};
