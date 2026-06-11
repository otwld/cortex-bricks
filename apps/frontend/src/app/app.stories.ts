import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { App } from './app';

const meta: Meta<App> = {
  argTypes: {},
  component: App,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-root></app-root>`,
  }),
  title: 'frontend/ng/app',
};

export default meta;

type Story = StoryObj<App>;

/** Default App state. */
export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    await step('render the routed application shell', async () => {
      await expect(canvasElement.querySelector('app-root')).toBeInTheDocument();
    });
  },
};
