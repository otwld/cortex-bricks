import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { FormLayoutDemo } from './formlayoutdemo';

const meta: Meta<FormLayoutDemo> = {
  argTypes: {},
  component: FormLayoutDemo,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-formlayout-demo></app-formlayout-demo>`,
  }),
  title: 'dashboard/ng/uikit/formlayoutdemo',
};

export default meta;

type Story = StoryObj<FormLayoutDemo>;

/** Default Form Layout Demo state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render the layout examples', async () => {
      await expect(canvas.getByText('Vertical')).toBeVisible();
      await expect(canvas.getByText('Horizontal')).toBeVisible();
      await expect(canvas.getByText('Inline')).toBeVisible();
      await expect(canvas.getByText('Advanced')).toBeVisible();
    });

    await step('fill representative fields', async () => {
      const nameInput = canvas.getAllByLabelText('Name')[0];
      const emailInput = canvas.getAllByLabelText('Email')[0];

      await userEvent.type(nameInput, 'Ada Recruiter');
      await userEvent.type(emailInput, 'ada.recruiter@example.com');

      await expect(nameInput).toHaveValue('Ada Recruiter');
      await expect(emailInput).toHaveValue('ada.recruiter@example.com');
    });
  },
};
