import { signal } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { AiCompletionService, AiModelsService, AiUsageService } from '@otwld/ng-ai';
import type { AiCompletionRequest, AiModelAlias, AiQuotaUsageSnapshot } from '@otwld/ts-ai';
import { AiCompletionPage } from './ai-completion.page';

const models: AiModelAlias[] = [
  {
    alias: 'fast',
    capabilities: ['completion'],
    label: 'Fast completion',
    providerModel: 'openai/gpt-4.1-mini',
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

const completionText = signal('');
const completionLoading = signal(false);
const completionError = signal(null);
const listModels = fn(async () => models);
const loadUsage = fn(async () => usage);
const complete = fn(async (request: AiCompletionRequest) => {
  completionText.set(`Prepared changelog entry for: ${request.prompt}`);
  return completionText();
});
const abort = fn();

const meta: Meta<AiCompletionPage> = {
  argTypes: {},
  component: AiCompletionPage,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: AiCompletionService,
          useValue: {
            abort,
            complete,
            error: completionError,
            loading: completionLoading,
            text: completionText,
          },
        },
        {
          provide: AiModelsService,
          useValue: {
            list: listModels,
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
    template: `<app-ai-completion-page></app-ai-completion-page>`,
  }),
  title: 'dashboard/ng/apps/ai/completion/ai-completion',
};

export default meta;

type Story = StoryObj<AiCompletionPage>;

/** Default AI Completion Page state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render completion quota and model data', async () => {
      await expect(canvas.getByRole('heading', { name: /ai completion/i })).toBeVisible();
      await expect(await canvas.findByText(/prompt limit 3,000 tokens/i)).toBeVisible();
      await expect(listModels).toHaveBeenCalledTimes(1);
    });

    await step('generate completion text from the prompt', async () => {
      const prompt = canvas.getByLabelText('Prompt');
      complete.mockClear();

      await userEvent.clear(prompt);
      await userEvent.type(prompt, 'Write a hiring pipeline launch note.');
      await userEvent.click(canvas.getByRole('button', { name: /generate/i }));

      await expect(complete).toHaveBeenCalledWith({
        model: 'fast',
        prompt: 'Write a hiring pipeline launch note.',
      });
      await expect(
        await canvas.findByText(/prepared changelog entry for: write a hiring pipeline launch note/i),
      ).toBeVisible();
    });

    await step('abort the active completion', async () => {
      abort.mockClear();

      await userEvent.click(canvas.getByRole('button', { name: /abort/i }));
      await expect(abort).toHaveBeenCalledTimes(1);
    });
  },
};
