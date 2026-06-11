import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { AiModelsService } from '@otwld/ng-ai';
import type { AiModelAlias } from '@otwld/ts-ai';
import { AiAssistPage } from './ai-assist.page';

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

const listModels = fn(async () => models);

const meta: Meta<AiAssistPage> = {
  argTypes: {},
  component: AiAssistPage,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: AiModelsService,
          useValue: {
            list: listModels,
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
    template: `<app-ai-assist-page></app-ai-assist-page>`,
  }),
  title: 'dashboard/ng/apps/ai/assist/ai-assist',
};

export default meta;

type Story = StoryObj<AiAssistPage>;

/** Default AI Assist Page state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('load completion models for the assist selector', async () => {
      await expect(canvas.getByRole('heading', { name: /ai form assist/i })).toBeVisible();
      await expect(listModels).toHaveBeenCalledTimes(1);
    });

    await step('reset edited support context', async () => {
      const customer = canvas.getByLabelText('Customer');

      await userEvent.clear(customer);
      await userEvent.type(customer, 'Ada Lovelace');
      await expect(customer).toHaveValue('Ada Lovelace');

      await userEvent.click(canvas.getByRole('button', { name: /reset/i }));
      await expect(customer).toHaveValue('Maya Chen');
      await expect(canvas.getByText(/no activity yet/i)).toBeVisible();
    });
  },
};
