import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { TreeDemo } from './treedemo';

const meta: Meta<TreeDemo> = {
  argTypes: {},
  component: TreeDemo,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-tree-demo></app-tree-demo>`,
  }),
  title: 'dashboard/ng/uikit/treedemo',
};

export default meta;

type Story = StoryObj<TreeDemo>;

/** Default Tree Demo state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render tree fixtures', async () => {
      await expect(await canvas.findByText('Documents')).toBeVisible();
      await expect(canvas.getByText('TreeTable')).toBeVisible();
      await expect(await canvas.findByText('Applications')).toBeVisible();
    });

    await step('toggle the first tree checkbox', async () => {
      const checkbox = canvas.getAllByRole('checkbox')[0];

      await userEvent.click(checkbox);

      await expect(checkbox).toBeChecked();
    });
  },
};
