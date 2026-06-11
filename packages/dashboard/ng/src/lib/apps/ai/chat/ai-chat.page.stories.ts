import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { AiChatService, AiModelsService, AiUsageService } from '@otwld/ng-ai';
import type { AiModelAlias, AiQuotaUsageSnapshot } from '@otwld/ts-ai';
import { AiChatPage } from './ai-chat.page';

const models: AiModelAlias[] = [
  {
    alias: 'chat',
    capabilities: ['chat'],
    label: 'Chat model',
    providerModel: 'openai/gpt-4.1',
  },
  {
    alias: 'fast',
    capabilities: ['completion'],
    label: 'Fast completion',
    providerModel: 'openai/gpt-4.1-mini',
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

const listModels = fn(async () => models);
const loadUsage = fn(async () => usage);
const sendMessage = fn(async () => undefined);
const stop = fn(async () => undefined);
const createChat = fn(
  () =>
    ({
      messages: [],
      sendMessage,
      stop,
    }) as ReturnType<AiChatService['createChat']>,
);

const meta: Meta<AiChatPage> = {
  argTypes: {},
  component: AiChatPage,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: AiChatService,
          useValue: {
            createChat,
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
    template: `<app-ai-chat-page></app-ai-chat-page>`,
  }),
  title: 'dashboard/ng/apps/ai/chat/ai-chat',
};

export default meta;

type Story = StoryObj<AiChatPage>;

/** Default AI Chat Page state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render the empty chat with quota usage', async () => {
      await expect(canvas.getByRole('heading', { name: /ai chat/i })).toBeVisible();
      await expect(await canvas.findByText(/prompt limit 3,000 tokens/i)).toBeVisible();
      await expect(listModels).toHaveBeenCalledTimes(1);
      await expect(createChat).toHaveBeenCalledWith({ model: 'chat' });
    });

    await step('send a recruiter chat message', async () => {
      const message = canvas.getByLabelText('Chat message');
      sendMessage.mockClear();

      await userEvent.clear(message);
      await userEvent.type(message, 'Draft a screening plan for the platform architect role.');
      await userEvent.click(canvas.getByRole('button', { name: /send/i }));

      await expect(sendMessage).toHaveBeenCalledWith({
        text: 'Draft a screening plan for the platform architect role.',
      });
      await expect(message).toHaveValue('');
    });

    await step('stop the active response', async () => {
      stop.mockClear();

      await userEvent.click(canvas.getByRole('button', { name: /stop/i }));
      await expect(stop).toHaveBeenCalledTimes(1);
    });
  },
};
