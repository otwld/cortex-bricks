import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { Tanstack } from './tanstack';

const meta: Meta<Tanstack> = {
  argTypes: {},
  component: Tanstack,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<tanstack-tanstack></tanstack-tanstack>`,
  }),
  title: 'tanstack/ng/tanstack',
};

export default meta;

type Story = StoryObj<Tanstack>;

/** Default Tanstack state. */
export const Default: Story = {
  play: async ({ canvas, step }) => {
    await step('render the package placeholder component', async () => {
      await expect(canvas.getByText('Tanstack works!')).toBeVisible();
    });
  },
};
