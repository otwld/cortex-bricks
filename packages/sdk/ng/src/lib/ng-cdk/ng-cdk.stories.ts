import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { NgCdk } from './ng-cdk';

const meta: Meta<NgCdk> = {
  argTypes: {},
  component: NgCdk,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<lib-ng-cdk></lib-ng-cdk>`,
  }),
  title: 'sdk/ng/ng-cdk',
};

export default meta;

type Story = StoryObj<NgCdk>;

/** Default Angular CDK state. */
export const Default: Story = {
  play: async ({ canvas, step }) => {
    await step('render the SDK Angular placeholder component', async () => {
      await expect(canvas.getByText('NgCdk works!')).toBeVisible();
    });
  },
};
