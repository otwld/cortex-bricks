import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { InputDemo } from './inputdemo';

const meta: Meta<InputDemo> = {
  argTypes: {},
  component: InputDemo,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-input-demo></app-input-demo>`,
  }),
  title: 'dashboard/ng/uikit/inputdemo',
};

export default meta;

type Story = StoryObj<InputDemo>;

/** Default Input Demo state. */
export const Default: Story = {
  play: async ({ canvas, canvasElement, step, userEvent }) => {
    await step('render the input groups', async () => {
      await expect(canvas.getByText('InputText')).toBeVisible();
      await expect(canvas.getByText('AutoComplete')).toBeVisible();
      await expect(canvas.getByText('RadioButton')).toBeVisible();
      await expect(canvas.getByText('InputGroup')).toBeVisible();
    });

    await step('update basic controls', async () => {
      const defaultInput = canvas.getByPlaceholderText('Default');
      const radioOption = canvasElement.querySelector<HTMLInputElement>('p-radiobutton#option1 input[type="radio"]');

      await userEvent.type(defaultInput, 'Candidate search');
      await expect(radioOption).toBeInTheDocument();
      await userEvent.click(radioOption!);

      await expect(defaultInput).toHaveValue('Candidate search');
      await expect(radioOption).toBeChecked();
    });

    await step('toggle a binary control', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /no/i }));

      await expect(canvas.getByRole('button', { name: /yes/i })).toBeVisible();
    });
  },
};
