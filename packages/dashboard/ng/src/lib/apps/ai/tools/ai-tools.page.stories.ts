import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { AiToolService } from '@otwld/ng-ai';
import type { AiToolDescriptor } from '@otwld/ts-ai';
import { AiToolsPage } from './ai-tools.page';

const tools: AiToolDescriptor[] = [
  {
    description: 'Searches candidates by role, skills, and availability.',
    inputSchema: {
      properties: {
        query: { type: 'string' },
      },
      required: ['query'],
      type: 'object',
    },
    name: 'candidateSearch',
    requiresApproval: true,
  },
  {
    description: 'Summarizes recent hiring pipeline activity.',
    inputSchema: {
      properties: {
        window: { enum: ['day', 'week'] },
      },
      type: 'object',
    },
    name: 'pipelineSummary',
    requiresApproval: false,
  },
];

const listTools = fn(async () => tools);

const meta: Meta<AiToolsPage> = {
  argTypes: {},
  component: AiToolsPage,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: AiToolService,
          useValue: {
            list: listTools,
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
    template: `<app-ai-tools-page></app-ai-tools-page>`,
  }),
  title: 'dashboard/ng/apps/ai/tools/ai-tools',
};

export default meta;

type Story = StoryObj<AiToolsPage>;

/** Default AI Tools Page state. */
export const Default: Story = {
  play: async ({ canvas, step }) => {
    await step('load registered AI tools into the table', async () => {
      await expect(canvas.getByRole('heading', { name: /ai tools/i })).toBeVisible();
      await expect(listTools).toHaveBeenCalledTimes(1);
      await expect(await canvas.findByRole('cell', { name: 'candidateSearch' })).toBeVisible();
      await expect(canvas.getByRole('cell', { name: 'Required' })).toBeVisible();
      await expect(canvas.getByRole('cell', { name: 'pipelineSummary' })).toBeVisible();
      await expect(canvas.getByRole('cell', { name: 'Automatic' })).toBeVisible();
    });
  },
};
