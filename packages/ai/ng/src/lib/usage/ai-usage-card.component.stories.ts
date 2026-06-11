import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import type { AiQuotaUsageSnapshot } from '@otwld/ts-ai';
import { AiUsageService } from '../services/ai-usage.service';
import { AiUsageCardComponent } from './ai-usage-card.component';

const candidateInterviewUsage: AiQuotaUsageSnapshot = {
  buckets: [
    {
      exceeded: false,
      limitTokens: 10000,
      remainingTokens: 5800,
      reservedTokens: 400,
      resetAt: '2026-06-12T00:00:00.000Z',
      usedTokens: 4200,
      window: {
        size: 1,
        unit: 'day',
      },
    },
  ],
  maxPromptTokens: 2000,
  subject: {
    id: 'recruiter-ada',
    roles: ['recruiter'],
    type: 'user',
  },
};

const loadUsageSnapshot = fn(async () => candidateInterviewUsage);

const meta: Meta<AiUsageCardComponent> = {
  argTypes: {
    autoRefreshMs: {
      control: { type: 'number', min: 0, max: 60000, step: 1000 },
      description: 'Optional interval that refreshes candidate AI usage in milliseconds.',
      table: { category: 'Inputs' },
    },
  },
  args: {
    autoRefreshMs: undefined,
  },
  component: AiUsageCardComponent,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: AiUsageService,
          useValue: {
            snapshot: loadUsageSnapshot,
          },
        },
      ],
    }),
  ],
  parameters: {
    actions: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<ai-usage-card [autoRefreshMs]="autoRefreshMs"></ai-usage-card>`,
  }),
  title: 'ai/ng/usage/ai-usage-card',
};

export default meta;

type Story = StoryObj<AiUsageCardComponent>;

/** Default AI Usage Card Component state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('show recruiter quota usage', async () => {
      await expect(canvas.getByRole('heading', { name: /ai usage/i })).toBeVisible();
      await expect(await canvas.findByText(/prompt limit 2,000 tokens/i)).toBeVisible();
      await expect(canvas.getByText(/4,200 \/ 10,000/i)).toBeVisible();
    });

    await step('refresh quota usage on demand', async () => {
      loadUsageSnapshot.mockClear();

      await userEvent.click(canvas.getByRole('button', { name: /refresh ai usage/i }));
      await expect(loadUsageSnapshot).toHaveBeenCalledTimes(1);
    });
  },
};
