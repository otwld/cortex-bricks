import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { FaqPage } from './faq.page';

const meta: Meta<FaqPage> = {
  argTypes: {},
  component: FaqPage,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-faq-page></app-faq-page>`,
  }),
  title: 'dashboard/ng/faq',
};

export default meta;

type Story = StoryObj<FaqPage>;

/** Default Faq Page state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render FAQ categories', async () => {
      await expect(canvas.getByText('Frequently Asked Questions')).toBeVisible();
      await expect(canvas.getByRole('button', { name: /general/i })).toBeVisible();
      await expect(canvas.getByText('Is there a trial period?')).toBeVisible();
    });

    await step('switch to billing questions and expand one answer', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /billing/i }));

      await expect(canvas.getByText('Will I receive an invoice?')).toBeVisible();

      await userEvent.click(canvas.getByRole('button', { name: /will i receive an invoice/i }));

      await expect(canvas.getAllByText(/Duis aute irure dolor/i)[0]).toBeInTheDocument();
    });
  },
};
