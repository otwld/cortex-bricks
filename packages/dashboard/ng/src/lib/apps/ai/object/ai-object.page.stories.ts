import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { AiModelsService, AiObjectService, AiUsageService } from '@otwld/ng-ai';
import type { AiModelAlias, AiQuotaUsageSnapshot } from '@otwld/ts-ai';
import { AiObjectPage } from './ai-object.page';

const models: AiModelAlias[] = [
  {
    alias: 'structured',
    capabilities: ['object'],
    label: 'Structured model',
    providerModel: 'openai/gpt-4.1',
  },
  {
    alias: 'chat',
    capabilities: ['chat'],
    label: 'Chat model',
    providerModel: 'openai/gpt-4.1',
  },
];

const usage: AiQuotaUsageSnapshot = {
  buckets: [
    {
      exceeded: false,
      limitTokens: 12000,
      remainingTokens: 8500,
      reservedTokens: 250,
      resetAt: '2026-06-12T00:00:00.000Z',
      usedTokens: 3500,
      window: {
        size: 1,
        unit: 'day',
      },
    },
  ],
  maxPromptTokens: 3000,
  subject: {
    id: 'recruiter-ada',
    roles: ['recruiter'],
    type: 'user',
  },
};

const summary = {
  bullets: ['The upload flow is faster.', 'Progress labels need clearer status copy.'],
  sentiment: 'positive',
  title: 'Upload flow feedback',
};

const listModels = fn(async () => models);
const loadUsage = fn(async () => usage);
const generateObject = fn(async () => summary);

const meta: Meta<AiObjectPage> = {
  argTypes: {},
  component: AiObjectPage,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: AiModelsService,
          useValue: {
            list: listModels,
          },
        },
        {
          provide: AiObjectService,
          useValue: {
            generate: generateObject,
          },
        },
        {
          provide: AiUsageService,
          useValue: {
            snapshot: loadUsage,
          },
        },
      ],
    }),
  ],
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-ai-object-page></app-ai-object-page>`,
  }),
  title: 'dashboard/ng/apps/ai/object/ai-object',
};

export default meta;

type Story = StoryObj<AiObjectPage>;

/** Default AI Object Page state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render structured generation inputs', async () => {
      await expect(canvas.getByRole('heading', { name: /ai object/i })).toBeVisible();
      await expect(await canvas.findByText(/prompt limit 3,000 tokens/i)).toBeVisible();
      await expect(listModels).toHaveBeenCalledTimes(1);
    });

    await step('generate a structured summary object', async () => {
      const prompt = canvas.getByLabelText('Prompt');
      const input = canvas.getByLabelText('Input');
      generateObject.mockClear();

      await userEvent.clear(prompt);
      await userEvent.type(prompt, 'Summarize candidate feedback.');
      await userEvent.clear(input);
      await userEvent.type(input, 'Candidate likes the faster review flow but wants clearer interview status labels.');
      await userEvent.click(canvas.getByRole('button', { name: /generate object/i }));

      await expect(generateObject).toHaveBeenCalledWith('summary', {
        input: {
          text: 'Candidate likes the faster review flow but wants clearer interview status labels.',
        },
        model: 'structured',
        prompt: 'Summarize candidate feedback.',
      });
      await expect(await canvas.findByText(/upload flow feedback/i)).toBeVisible();
    });
  },
};
