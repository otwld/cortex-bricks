import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { Detail2 } from './detail2';

const meta: Meta<Detail2> = {
  argTypes: {},
  component: Detail2,
  parameters: {
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-detail2></app-detail2>`,
  }),
  title: 'dashboard/ng/apps/cms/detail2',
};

export default meta;

type Story = StoryObj<Detail2>;

/** Default Detail2 state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render the article and table of contents', async () => {
      await expect(canvas.getByRole('heading', { name: /how manufacturing giants drive economic growth/i })).toBeVisible();
      await expect(canvas.getByText('On this page')).toBeVisible();
      await expect(canvas.getByRole('button', { name: /workforce development and skills training/i })).toBeVisible();
    });

    await step('navigate by table of contents', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /strategic manufacturing investment/i }));

      await expect(canvas.getAllByText('Strategic Manufacturing Investment')[0]).toBeVisible();
    });
  },
};
