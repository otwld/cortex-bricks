import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { CrudPage } from './crud.page';

const meta: Meta<CrudPage> = {
  argTypes: {},
  component: CrudPage,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-crud-page></app-crud-page>`,
  }),
  title: 'dashboard/ng/crud',
};

export default meta;

type Story = StoryObj<CrudPage>;

/** Default Crud Page state. */
export const Default: Story = {
  play: async ({ canvas, canvasElement, step, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await step('render product management data', async () => {
      await expect(canvas.getByText('Manage Products')).toBeVisible();
      await expect(await canvas.findByText('Bamboo Watch')).toBeVisible();
      await expect(canvas.getByPlaceholderText('Search...')).toBeVisible();
    });

    await step('open the product dialog and show required validation', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /new/i }));

      await expect(body.getByRole('dialog', { name: /product details/i })).toBeVisible();

      await userEvent.click(body.getByRole('button', { name: /save/i }));

      await expect(body.getByText('Name is required.')).toBeVisible();
    });
  },
};
